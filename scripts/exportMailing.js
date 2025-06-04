import * as fs from 'fs'
import * as fse from 'fs-extra'
import { JSDOM } from 'jsdom'
import * as path from 'path'
import * as puppeteer from 'puppeteer'
import * as zipper from 'zip-local'
import { config } from '../config/configuration'

try {
	if (fs.existsSync(path.resolve('export'))) {
		fs.rmSync(path.resolve('export'), { recursive: true, force: true })
	}
	fs.mkdirSync(path.resolve('export'), { recursive: true })
} catch (err) {
	console.log(err)
}
let dom, images
generate().then(r => {
	if (fs.existsSync(path.resolve('dist'))) {
		fs.rmSync(path.resolve('dist'), { recursive: true, force: true })
	}
	if (fs.existsSync(path.resolve('export', 'tmp'))) {
		fs.rmSync(path.resolve('export', 'tmp'), { recursive: true, force: true })
	}
})

async function generate() {
	let from = path.resolve('images' + '/*.{jpg,JPG,jpeg,JPEG,gif,png,svg}')
	var result = fs.readFileSync(path.resolve('dist', 'index.html'), { encoding: 'utf8', flag: 'r' })
	var survey_link = ''
	result = result.replace('RTE_NAME', config.RTE_NAME)
	result = result.split('RTE_ALT').join(config.RTE_ALT)
	result = result.replace('RTE_PREHEADER', config.RTE_PREHEADER)
	result = result.replace('<script defer="defer" src="js/main.js"></script>', '')

	const filePath = path.resolve('dist', 'css', 'main.css');
	if (fs.existsSync(filePath)) {
			var css = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
			result = result.replace('</head>', '<style> ' + css + '</style></head>');
	}

	switch (config.RTE_TYPE) {
		case 'VEEVA':
			result = result.replace('RTE_UNSUBSCRIBE', '{{unsubscribe_product_link}}')
			if (fs.existsSync(path.resolve('dist', 'images'))) {
				await fse.copy(path.resolve('dist', 'images'), path.resolve('export', 'images'))
			}
			if (config.RTE_SANOFI.toUpperCase() === 'YES') {
				survey_link =
					'https://dta.eu.qualtrics.com/jfe/form/SV_02HIRZB8on1Cf7U?' +
					'Country=PL' +
					'&Q_Language=PL' +
					'&TA={{User.SA_Department__c}}' +
					'&utm_hcpid={{Account.Account_Identifier_vod__c}}' +
					'&User={{User.EmployeeNumber}}' +
					'&Function={{User.SA_Visibility__c}}' +
					'&Brand={{Approved_Document_vod__c.Product_vod__r.Name}}' +
					'&CN={{Approved_Document_vod__c.Name}}' +
					'&Document_ID={{Approved_Document_vod__c.Document_Description_vod__c}}' +
					'&Region={{User.Primary_Territory_vod__c}}' +
					'&DA={{Approved_Document_vod__c.Detail_Group_vod__r.Name}}'
			} else {
				survey_link = '#'
			}
			result = result.replaceAll('RTE_SURVEY_LINK', survey_link)
			break

		case 'SFMC':
			result = result.replace(
				'<body>',
				'<body><div style="display:none"><a href="%%profile_center_url%%">.</a><a href="%%subscription_center_url%%">.</a><a href="%%unsub_center_url%%">.</a></div>\n' +
					'<div style="font-size: 0; color: #ffffff">' +
					'%%[set @Sanofi_ID = [Sanofi_ID] ]%%\n' +
					'%%[set @Account_ID = [Account_ID] ]%%\n' +
					"%%[set @utms = concat('&utm_hcpid=', @Sanofi_ID, '&actid=', @Account_ID, '&Q_Language=PL') ]%%\n" +
					'%%[ SET @utm_campaign = __AdditionalEmailAttribute1 ]%%\n' +
					'%%[ SET @utm_source = __AdditionalEmailAttribute2 ]%%\n' +
					'\n' +
					'%%[set @SubscriberKey = _subscriberkey]%%\n' +
					'%%[set @EventDate = GetSendTime()]%%\n' +
					'%%[set @View_Link = view_email_url]%%\n' +
					'%%[set @Email_Id = _emailid]%%\n' +
					'%%[set @Email_Name = emailname_]%%\n' +
					'%%[set @Email = emailaddr]%%\n' +
					'\n' +
					'%%[if empty(__AdditionalEmailAttribute2) OR empty(__AdditionalEmailAttribute1)  then\n' +
					"RaiseError('Ops, looks like you missed Campaign code or Exposure Code!', false)]%%\n" +
					'%%[endif]%%\n' +
					'\n' +
					'%%[set @rows = LookupRows("ENT.PROD_POL_Metadata","CampaignCode", @Utm_Campaign)\n' +
					'set @rowCount = rowcount(@rows)\n' +
					'if @rowCount == 0 then\n' +
					'RaiseError("This campaign Code is not listed", false)\n' +
					'endif]%%\n' +
					'\n' +
					'%%[set @rows = LookupRows("ENT.PROD_POL_Metadata","ExposureCode", @utm_source)\n' +
					'set @rowCount = rowcount(@rows)\n' +
					'if @rowCount == 0 then\n' +
					'RaiseError("This exposure Code is not listed", false)\n' +
					'endif]%%\n' +
					'\n' +
					'%%[ SET @countryCode = "PL"\n' +
					'SET @language = "PL"\n' +
					'SET @email = [Email Address]\n' +
					'SET @subKey = AttributeValue("_subscriberkey")\n' +
					'SET @jobID = [jobid]\n' +
					'SET @subID = AttributeValue("subscriberid")\n' +
					'SET @memberID = AttributeValue("memberid")\n' +
					'\n' +
					'SET @url = CloudPagesURl(191,"countryCode",@countryCode,"email",@email,"subscriberkey",@subKey,"jobid",@jobID,"language",@language,"subID",@subID,"memberID",@memberID) ]%%\n' +
					'</div><custom name="opencounter" type="tracking"/>' +
					'' +
					'<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="%%view_email_url%%" style="font-family:Arial, Helvetica, Verdana, sans-serif; color: #595959; font-size: 12px;">Zobacz w przeglądarce</a><br><br></td></tr></table>'
			)
			result = result.replace('RTE_UNSUBSCRIBE', '%%=RedirectTo(@url)=%%')
			// Only add survey link if RTE_SANOFI is 'YES'
      if (
        config.RTE_SANOFI.toUpperCase() === "YES"
      ) {
        if (config.RTE_DIVISION === "GENMED") {
          survey_link =
            "https://dta.eu.qualtrics.com/jfe/form/SV_efWbOu2lUz2aZpQ?CO=PL&CN=GenMed Poland HQ Email&BU=General Medicines";
        } else if (config.RTE_DIVISION === "VACCINES") {
          survey_link =
            "	https://dta.eu.qualtrics.com/jfe/form/SV_efWbOu2lUz2aZpQ?CO=PL&CN=Vaccines Poland HQ Email&BU=Vaccines";
        } else if (config.RTE_DIVISION === "SPECIALITY_CARE") {
          survey_link =
            "https://dta.eu.qualtrics.com/jfe/form/SV_efWbOu2lUz2aZpQ?CO=PL&CN=Specialty Care Poland HQ Email&BU=Specialty Care";
        } else {
          survey_link =
            "https://dta.eu.qualtrics.com/jfe/form/SV_efWbOu2lUz2aZpQ?" +
            "CO=PL" +
            "&Q_Language=PL" +
            "&CN={{ContentName}}" +
            "&BU={{BusinessUnit}}" +
            "&TA={{User.SA_Department__c}}" +
            "&utm_hcpid={{Account.Account_Identifier_vod__c}}" +
            "&User={{User.EmployeeNumber}}" +
            "&Function={{User.SA_Visibility__c}}";
        }
      } else {
        survey_link = "#";
      }
			result = result.replaceAll('RTE_SURVEY_LINK', survey_link)
			result = result.replace(
				'</body>',
				'<img src="https://click.news.email.sanofi/open.aspx?ffcb10-fefd15757c6704-fe9911747762067c77-fe3e117175640479761771-ff9b1573-fe5c157077660c747d11-ffce15&d=500002&bmt=0" width="1" height="1" alt=""></body>'
			)
			if (fs.existsSync(path.resolve('dist', 'images'))) {
				await fse.copy(path.resolve('dist', 'images'), path.resolve('export', 'images'))
			}
			break
		case 'PITCHER':
			result = result.replace('RTE_UNSUBSCRIBE', '{{{unsubscribeLink}}}')
			break
		case 'MASSMAILING':
			result = result.split('./images/').join('')
			result = result.replace('RTE_UNSUBSCRIBE', config.RTE_UNSUBSCRIBE_MAIL)
			if (fs.existsSync(path.resolve('dist', 'images'))) {
				await fse.copy(path.resolve('dist', 'images'), path.resolve('export'))
			}
			break
		case 'WP':
			result = result.replace(
				'</head>',
				'<style>img {vertical-align: middle;} td img { display: block; }</style></head>'
			)
			result = result.split('./images/').join('')
			if (fs.existsSync(path.resolve('dist', 'images'))) {
				await fse.copy(path.resolve('dist', 'images'), path.resolve('export'))
			}
			dom = new JSDOM(Buffer.from(result, 'utf-8'))
			let links = dom.window.document.querySelectorAll('a')
			images = dom.window.document.querySelectorAll('img')
			for (const link of links) {
				let tmp = link.getAttribute('href')
				link.setAttribute('href', '<KLIK>' + tmp + '</KLIK>')
				link.setAttribute('target', '_blank')
			}
			for (const image of images) {
				let tmp = image.getAttribute('src')
				image.setAttribute('src', 'cid:' + tmp)
			}
			fs.writeFile(
				path.resolve('export', 'index1.html'),
				dom.window.document.documentElement.outerHTML,
				async function () {}
			)
			break
		case 'INIS':
			result = result.split('./images/').join('')
			if (fs.existsSync(path.resolve('dist', 'images'))) {
				await fse.copy(path.resolve('dist', 'images'), path.resolve('export'))
			}
			dom = new JSDOM(Buffer.from(result, 'utf-8'))
			let cells = dom.window.document.querySelectorAll('td')
			for (const cell of cells) {
				let tmp = cell.getAttribute('style')
				cell.setAttribute('style', 'mso-line-height-rule: exactly; line-height: 13px; font-size: 12px; ' + tmp)
			}
			images = dom.window.document.querySelectorAll('img')
			for (const image of images) {
				if (!image.getAttribute('width')) image.setAttribute('width', '100%')
			}
			result = dom.window.document.documentElement.outerHTML
			result = result.replace(
				'<body>',
				'<body><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="%www_version%" style="font-family:Arial, Helvetica, Verdana, sans-serif; color: #595959; font-size: 12px;">Zobacz w przeglądarce</a><br><br></td></tr></table>'
			)
			result = result.replace(
				'<html>',
				'<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"><html>'
			)
			break
		case '':
			result = result.split('./images/').join('')
			result = result.replace('RTE_UNSUBSCRIBE', config.RTE_UNSUBSCRIBE_MAIL)
			if (fs.existsSync(path.resolve('dist', 'images'))) {
				await fse.copy(path.resolve('dist', 'images'), path.resolve('export'))
			}
			break
		default:
			result = result.split('./images/').join('')
			result = result.replace('RTE_UNSUBSCRIBE', config.RTE_UNSUBSCRIBE_MAIL)
			if (fs.existsSync(path.resolve('dist', 'images'))) {
				await fse.copy(path.resolve('dist', 'images'), path.resolve('export'))
			}
			break
	}
	await fs.writeFile(path.resolve('export', 'index.html'), result, async function () {
		const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'], defaultViewport: null })
		const page = await browser.newPage()
		let ref = path.resolve('export', 'index.html')
		if (!ref) ref = path.resolve('dist', 'index.html')
		await page.goto('file://' + ref)
		await page.screenshot({ path: 'screenshot.png', fullPage: true })
		await browser.close()
	})

	await createImageZip()
	const zip1 = zipper.sync.zip(path.resolve('export'))
	if (zip1) {
		zip1.compress()
		let buff = zip1.memory()
		let filename = config.RTE_NAME.replace(/[^a-z0-9]/gi, '_').toLowerCase()
		zip1.save(path.resolve('export', 'export_' + filename + '.zip'), err => {
			if (err) console.log(err)
		})
	}
}

async function createImageZip() {
	if (fs.existsSync(path.resolve('export', 'images'))) {
		fs.mkdirSync(path.resolve('export', 'tmp'), { recursive: true })
		await fse.copy(path.resolve('export', 'images'), path.resolve('export', 'tmp', 'images'))
		const zip = zipper.sync.zip(path.resolve('export', 'tmp'))
		if (zip) {
			zip.compress()
			let buff = zip.memory()
			zip.save(path.resolve('export', 'images.zip'), err => {
				if (err) console.log(err)
			})
		}
		fs.rmSync(path.resolve('export', 'images'), { recursive: true, force: true })
	} else console.log('not-exists')
}

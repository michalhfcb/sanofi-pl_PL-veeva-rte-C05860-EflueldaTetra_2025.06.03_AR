import {config} from  '../config/configuration'
import * as path from 'path'
import * as fs from "fs"

try {
    if(fs.existsSync(path.resolve('js','images.js'))) fs.unlinkSync(path.resolve('js','images.js'))
    if(fs.existsSync(path.resolve('sass','email.scss'))) fs.unlinkSync(path.resolve('sass','email.scss'))
    if(!fs.existsSync(path.resolve('images'))) fs.mkdirSync(path.resolve('images'))
    if(fs.existsSync(path.resolve('export'))){
        fs.rmSync(path.resolve('export'), { recursive: true, force: true })
    }
    fs.mkdirSync(path.resolve('export'), { recursive: true })
    // let imageList = '';
    // fs.readdirSync(path.resolve('images')).forEach(file => {
    //     if(file !== '.DS_Store') imageList += "import '../images/" + file + "';\n";
    // });
    fs.writeFileSync(path.resolve('sass','email.scss'),'');
    // fs.writeFileSync(path.resolve('js','images.js'),imageList);
}catch(err){
    console.log(err);
}


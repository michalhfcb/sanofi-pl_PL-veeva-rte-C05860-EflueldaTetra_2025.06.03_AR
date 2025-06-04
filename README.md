# Email Template

Default template for RTE.

## Usage

To start development need to install dev dependencies
`npm install ` or `yarn install `

To create all necessary files (generate pug files)
`npm run create ` or `yarn run create `

To start development mode with hot reload
`npm run dev ` or `yarn dev`

To build new production package
`npm run build` or `yarn build`

To build new production export packages to veeva
`npm run export` or `yarn run export`

## Requirements

- text in cell must be in tag span
- Set up all necessary const in `./config/configuration.js` for example:

```js
	RTE_NAME: '',
	RTE_ALT: '',
	RTE_PREHEADER: '',
	RTE_TYPE: '', //POSSIBLE VALUES: VEEVA, SFMC, PITCHER, MASSMAILING, WP, INIS
	RTE_SANOFI: '', // POSSIBLE VALUES: YES, NO - Controls whether to include survey links
	RTE_UNSUBSCRIBE_MAIL: 'mailto:noreply@example.com', //ONLY FOR MASSMAILING
```

- set up all necessary variables in `./sass/variables.scss`
- put all styles as inline or add classes in `./sass/email.scss` it will be imported into exported html file as styles in head

To add predefined footer in `block footer` section use predefined mixins:

- `+sanofiA()`
- `+sanofiA()`
- `+loreal()`

## References

| Mixin name              | Possible values                                                                                                                                                                                                              |
|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `+survey()` | adds sanofi marketing cloud survey   |                                                                                                                                                                                 |
| `+picture(type,url)`    | **necessary** type true - internal image, false - external image, **necessary** url - if internal only image name eg. logo.png else full link                                                                                |
| `+deeplink(link)`       | **necessary** link - deeplink to asset without https://campus.sanofi at beggining. **<a href="%%=RedirectTo(@redirectURL)=%%"** needs to be added after mixin                                                                |
| `+pictureResize(width,url,clas)`      | **necessary** width - width of image, **necessary** url - if internal only image name eg. logo.png else full link                                                                                                                                                                                        |

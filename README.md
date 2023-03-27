# README

[用户手册](https://docs.sc-viewer.top)

- [sc-viewer](https://sc-viewer.top): deployed instance
- [User Script](https://static.sc-viewer.top/viewer-button.user.js): userscript to redirect user from github csv page to [sc-viewer](https://sc-viewer.top) page

## Quickstart

### install dependencies

``` bash
yarn
```

### build

``` bash
make build
```

### development

``` bash
yarn dev
```

The app will run on port `5173`

#### TODOs

Refer to [TODOs](./TODOs.md)

#### development vscode plugins

- volar (refer to official documents for guides)
- prettier

#### configuration

Configure `.env` for belowing consts

##### resources

```js
// src/helper/path.ts
// assets server: used for voice, raw json(including chapter navigation), index thumb
const ASSETS_SERVER = import.meta.env.VITE_ASSETS_SERVER
// name service server: used for index, name suggestion
const NAME_SERVICE_SERVER = import.meta.env.VITE_NAME_SERVICE_SERVER

// transaction index: used to query if translation exists
const TRANSLATION_INDEX_URL = import.meta.env.VITE_TRANSLATION_INDEX_URL
// translation dir: used to fetch translation from translation query result
const TRANSLATION_DIR = import.meta.env.VITE_TRANSLATION_DIR

// github raw proxy: used as raw.githubusercontent.com proxy
const GITHUB_RAW_PROXY = import.meta.env.VITE_GITHUB_RAW_PROXY
// whether uses github raw proxy
const useGithubProxy = true

// event viewer site: used as iframe source to review story
const EVENT_VIEWER_SITE = import.meta.env.VITE_EVENT_VIEWER_SITE
```

##### authorization

```ts
// src/helper/auth.ts
const clientId =
  process.env.NODE_ENV === 'development'
    ? import.meta.env.VITE_DEV_CLIENT_ID
    : import.meta.env.VITE_CLIENT_ID

// this is a pure frontend application
// so it's ok to expose client secret
const clientSecret =
  process.env.NODE_ENV === 'development'
    ? import.meta.env.VITE_DEV_CLIENT_SECRET
    : import.meta.env.VITE_CLIENT_SECRET

// corredponding redirect uri of github oauth configuration
const HOSTNAME =
  process.env.NODE_ENV === 'development'
    ? import.meta.env.VITE_DEV_HOSTNAME
    : import.meta.env.VITE_HOSTNAME

// used to fetch access token
const GITHUB_PROXY = import.meta.env.VITE_GITHUB_PROXY
// used to proxy github rest api
const GITHUB_API_PROXY = import.meta.env.VITE_GITHUB_API_PROXY
```

Besides, if you are going to deploy on your server, change `VITE_CLIENT_ID, VITE_CLIENT_SECRET, VITE_HOSTNAME` according to [Github OAuth Apps Configuration](https://github.com/settings/developers), the `https://${HOSTNAME}/auth` is `Authorization callback URL` in your OAuth app configruation.

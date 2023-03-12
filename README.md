# README

## Quickstart

### install dependencies

``` bash
yarn
```

### build

``` bash
yarn build
```

### development

``` bash
yarn dev
```

The app will run on port `5173`

#### development vscode plugins

- volar (refer to official documents for guides)
- prettier

#### configuration

Configure `.env` for belowing consts

```js
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

## TODOs

### New Feature

- [ ] file name edit
  - [x] file name suggest
  - [x] file name input
  - [ ] force select file name when first save / download
- [x] index
- [ ] Use github interface to push csv directly
  - [ ] use popselect component for download csv
    - [ ] download or push to github
  - [ ] Use N-Step for pushing to Github
  - [ ] fix no github push panel problem
- [ ] machine translate
- [ ] render translation to review
- [ ] `make deploy` command

### Improvements

- [x] update browser extension
  - [ ] fix browser extension installation
- [ ] Util bar hiding
- [ ] recover review-story-in-new-page button user js
- [ ] modal font
- [x] tips
- [ ] optimize chapter jumping logic

### High Priority

- [ ] unit test
- [ ] **ready for open source**
  - [x] use .env for some const
  - [ ] implementation refactoring
  - [ ] lisence
  - [ ] documents
- [ ] fix local_trans bug
  - change trans and save
  - go to next chapter and back
- [ ] reset reviewing status when switch to other place
- [x] PWA support
- [x] badge for switch button
- [x] raw.githubcontents proxy
  - [x] font source switch

### Low Priority

- [ ] home page
  - [x] localstorage
    - [ ] remove specific item
    - [x] remove all

- [ ] Error process for remote json files
- [x] Check select label
- [ ] p's voice (sound effect/tts)
- [ ] Hide preview until login

### example url inputs

- `http://127.0.0.1:5173/translate#https://github.com/ShinyGroup/SCTranslationData/blob/master/data/story/七草にちか/【あっかい】七草にちか/1%20ポップ'n%20pop.csv`
- `http://127.0.0.1:5173/translate#produce_events/100200506.json`

## test cases

### save

- [ ] load a file
- [ ] load a history
- [ ] load a

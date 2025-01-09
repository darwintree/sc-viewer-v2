## TODOs

### New Feature

- [x] index
- [x] Use github interface to push csv directly
  - [x] use dropdown component for download csv
    - [x] download or push to github
  - [x] Use N-Step for pushing to Github
    - [x] UI when user is not logged in
    - [x] explanation
    - [x] explanation text under commit message and pr title
  - [ ] ~~fix no github push panel problem~~
- [x] machine translate
- [x] render translation to review
- [x] `make deploy` command
- [ ] static resource processing
- [ ] Remind user for untranslated sentences
- [ ] service worker
  - [ ] share_target
  - [ ] share
  - [ ] web push
- [x] load setting: if specified a json path, priority to load localstorage history
  - [x] remind user if to history mode
- [ ] comments(giscus)
  - [ ] splitted story comments and translation comments

### Improvements

- [ ] Refactor: Use pages folder
- [x] Edit: insert "\n" to cursor
- [x] Refactor: file loading process
- [ ] new end line for push process
- [x] update browser extension
  - [ ] fix browser extension installation
- [ ] Util bar hiding
- [ ] use vue-md-loader/ vite-plugin-naive-ui-md
- [x] recover review-story-in-new-page button user js
- [x] modal font
- [ ] tips
- [x] optimize chapter jumping logic
- [x] original translation dir
- [ ] list filter with icon
- [ ] force branch update
- [ ] perf: CSV display for complex csv name
  - [ ] test: direct location redirect
  - [ ] confirm button redirect (https://github.com/ShinyGroup/SCTranslationData/blob/master/data/story/283%E6%B4%BB%E5%8A%A8%E5%89%A7%E6%83%85/%23%EF%BC%92%EF%BC%98%EF%BC%93%E3%82%92%E3%81%B2%E3%82%8D%E3%81%92%E3%82%88%E3%81%86/%E7%AC%AC1%E8%A9%B1-MEETING.csv)
- [ ] file name edit
  - [x] file name suggest
  - [x] file name input
  - [ ] force select file name when first save / download
- [x] pretranslation
  - [x] pretranslation tag off
  - [x] batch size control

### High Priority

- [x] BUG FIX: reversed translations
- [ ] BUG FIX: birthday index
- [ ] ~~unit test~~
- [x] **ready for open source**
  - [x] use .env for some const
  - [x] implementation refactoring
  - [x] license
  - [x] documents
- [x] fix local_trans bug
  - change trans and save
  - go to next chapter and back
- [x] reset reviewing status when switch to other place
- [x] PWA support
  - [x] **cache and mode**(https://developer.chrome.com/docs/workbox/modules/workbox-build/#which-mode-to-use)
- [x] badge for switch button
- [x] raw.githubcontents proxy
  - [x] font source switch

### Low Priority

- [ ] home page

  - [x] localstorage
    - [ ] remove specific item
    - [x] remove all

- [x] Error process for remote json files
- [x] Check select label
- [ ] p's voice (sound effect/tts)
- [ ] Hide preview until login
- [ ] i18n for voice searching

### example url inputs

- `http://127.0.0.1:5173/translate#https://github.com/ShinyGroup/SCTranslationData/blob/master/data/story/七草にちか/【あっかい】七草にちか/1%20ポップ'n%20pop.csv`
- https://github.com/ShinyGroup/SCTranslationData/blob/master/data/story/283活动剧情/#２８３をひろげよう/第1話-MEETING.csv
- `http://127.0.0.1:5173/translate#produce_events/100200506.json`

## test cases

### save

- [ ] load a file
- [ ] load a history
- [ ] load a

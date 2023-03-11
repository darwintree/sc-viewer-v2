# README

## installation

``` bash
yarn
yarn dev
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
- [ ] recover review-story-in-new-page button
- [ ] modal font
- [x] tips

### High Priority

- [ ] unit test
- [ ] **ready for open source**
  - [ ] use .env for some const
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

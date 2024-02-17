# Changelog

## 2024/02/17

* feat: share

## 2023/12/21

* fix: missing hardcoded hana & haruki idol option

## 2023/12/16

* feat: supports haruki & hana voice search

## 2023/11/07

* perf: pretranslation ui changes for new gpt-4-1106-preview backend

## 2023/09/11

* perf: improves pretranslation speed and accuracy
* feat: support tag and batch size specification

## 2023/08/22

* feat: support voice search

## 2023/5/7

* feat: pre-translate using gpt-3.5

## 2023/4/28

* feat: translation switch link in notification

## 2023/4/27

* fix: wrong index modal
* perf: previous and next chapter display

## 2023/4/26

* feat: character common index support
  * index modal
  * list

## 2023/4/25

* feat: support luka
* feat: "\n" inserted in translation cursor rather than append to tail

## 2023/4/24

* feat: history save will be loaded with priority for chapter switching
* perf: improves loading performance

## 2023/4/22

* fix: switch modal jump destination parameter is not set correcty

## 2023/3/27

* perf: recommend path for push
* doc: user manual and about page

## 2023/3/26

* chore: domain migration to [sc-viewer.top](https://sc-viewer.top)

## 2023/3/25

* feat: push panel
* chore: PWA network options
* feat: manually login status refresh button
* perf: loading performance

## 2023/3/23

* fix: unexpected date format in list
* feat: push panel functions

## 2023/3/22

* fix: communication log render bug caused by Dialogue key
* perf: mobile list ui of "translated" column

## 2023/3/17

* fix: save warning not activated when using shift+enter to save
* fix: page hash didn't change after pressing confirm button

## 2023/3/16

* update: change list page size to 5
* feat: complete button to dropdown menu

## 2023/3/15

* feat: translation status tag for list panel on PC
* feat: post message (json and csv) on iframe

## 2023/3/14

* feat: list panel
* hide github panel
* update: translation tooltip

## 2023/3/12

* use linter
* move consts to `.env`
* update: github extension
* fix: csv url display

## 2023/3/11

* feat: support filename editing and recommendation
* feat: support communication index if found
* ui change: add util bar
* ui change: merge preview line and navigate line

## 2023/2/26

* feat: scroll back to top after chapter change
* feat: remind the user if translation is detected
* host browser extension user script from gist to this website

## 2023/2/3

* ui change: badge on date switch button
* feat: use proxy for raw.githubusercontent.com

## 2023/2/2

* feat: PWA support

## 2023/2/1

* feat: data source switch

## 2023/1/26

* feat: warn the user if the user is trying to overwrite a file in localstorage

## 2023/1/25

* fix: bug that overwrite history file names
* feat: notify user
  * if a json file is loaded
  * if current translation is saved

## 2023/1/24

* feat: introduce i18n

## 2023/1/23

* feat: sort history saves by latest update

## 2023/1/22

* Add an icon to indicate data source
* UI improvements
* feat: clear history

## 2023/1/19

* Add previous/next chapter button except for true end
* improve url display
* add homepage recent game updates button

## 2023/1/7

* Support browser localStorage
* Support local json files

## 2023/1/6

* Add keyboard shortcuts
  * url input: enter
  * translate input: enter, shift+enter, esc

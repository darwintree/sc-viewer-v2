import axios from 'axios'
import { units, characters } from '../assets/album-index.json'
import { reactive } from 'vue'
import {
  EventsCollectionMeta,
  CommunicationDataMeta,
  IndexData,
} from './meta-interfaces'
import { EventCategory } from './enum-interfaces'
import dataToCSV from './convert'

// assets server: used for voice, raw json(including chapter navigation), index thumb
const ASSETS_SERVER = import.meta.env.VITE_ASSETS_SERVER
// name service server: used for index, name suggestion
const NAME_SERVICE_SERVER = import.meta.env.VITE_NAME_SERVICE_SERVER
const VOICE_SERVICE_SERVER = import.meta.env.VITE_VOICE_SERVICE_SERVER
const BGM_SERVICE_SERVER = import.meta.env.VITE_BGM_SERVICE_SERVER

// transaction index: used to query if translation exists
const TRANSLATION_INDEX_URL = import.meta.env.VITE_TRANSLATION_INDEX_URL
// translation dir: used to fetch translation from translation query result
const TRANSLATION_DIR = import.meta.env.VITE_TRANSLATION_DIR

const PRETRANSLATION_DIR = import.meta.env.VITE_PRETRANSLATION_DIR

// github raw proxy: used as raw.githubusercontent.com proxy
const GITHUB_RAW_PROXY = import.meta.env.VITE_GITHUB_RAW_PROXY
// whether uses github raw proxy
const useGithubProxy = true

// event viewer site: used as iframe source to review story
const EVENT_VIEWER_SITE = import.meta.env.VITE_EVENT_VIEWER_SITE

const unitList: string[] = []

for (const unit of Object.keys(units)) {
  unitList.push(unit)
}

function getAvatarPath(name: string) {
  if (characters.some((character) => character.firstName === name)) {
    return `/icon/${name}.webp`
  }
  return '/icon/dummy.webp'
}

function getAudioPath(id: string, base: string) {
  return `${ASSETS_SERVER}/sounds/voice/events/${base}/${id}.m4a`
}

function getAudioPathFromVoiceId(_id: string) {
  return `${ASSETS_SERVER}/sounds/voice/events/${_id}.m4a`
}

// relPath includes .json postfix
function getJsonPath(relPath: string) {
  return `${ASSETS_SERVER}/json/${relPath}`
}

// relPath includes .json postfix
function getCustomJsonPath(relPath: string) {
  const CUSTOM_SERVER = import.meta.env.VITE_CUSTOM_SERVER
  return `${CUSTOM_SERVER}/json/${relPath}`
}

function getRemoteImgPath(relPath: string) {
  if (relPath.startsWith('images/ui/producer_desk')) return relPath
  return `${ASSETS_SERVER}/${relPath}`
}

function getQueryVariable(variable: string) {
  const query = window.location.search.substring(1)
  const vars = query.split('&')
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=')
    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1])
    }
  }
}

function getGithubRawResourcePath(url: string) {
  const useProxy = useGithubProxy
  if (url.startsWith('https://github.com')) {
    url = url
      .replace('https://github.com', 'https://raw.githubusercontent.com')
      .replace('/blob/', '/')
  }
  if (useProxy && url.startsWith('https://raw.githubusercontent')) {
    url = url.replace('https://raw.githubusercontent.com', GITHUB_RAW_PROXY)
  }
  return url
}

function getIframeSrc() {
  return `${EVENT_VIEWER_SITE}/main.html?iframeMode=1`
}

// https://github.com/ShinyGroup/SCTranslationData/blob/master/data/story/%E4%B8%89%E5%B3%B0%E7%B5%90%E8%8F%AF/%E3%80%90Hakoni%E2%96%A1a%E3%80%91%E4%B8%89%E5%B3%B0%E7%B5%90%E8%8F%AF/%E3%83%9A%E3%83%AB%E3%82%BD%E3%83%8A%E3%81%AA%E3%82%93%E3%81%A6%E7%AC%91%E3%81%A3%E3%81%A1%E3%82%83%E3%81%86.csv
function extractInfoFromUrl(fileUrl: string) {
  if (fileUrl.startsWith('https://github.com')) {
    const splits = fileUrl.split('/')
    let filePath = splits[9]
    for (let i = 0; i < splits.length; i++) {
      if (i > 9) {
        filePath += '/'
        filePath += splits[i]
      }
    }
    // console.table({
    //   path: filePath,
    // })
    return {
      path: filePath,
    }
  }
  throw new Error('wrong prefix')
}

// idol options are used as options to push file to github
const idolOptionKeys = [
  '283活动剧情',
  '櫻木真乃',
  '風野灯織',
  '八宮めぐる',
  '月岡恋鐘',
  '田中摩美々',
  '白瀬咲耶',
  '三峰結華',
  '幽谷霧子',
  '小宮果穂',
  '園田智代子',
  '西城樹里',
  '杜野凛世',
  '有栖川夏葉',
  '大崎甘奈',
  '大崎甜花',
  '桑山千雪',
  '芹沢あさひ',
  '黛冬優子',
  '和泉愛依',
  '浅倉透',
  '樋口円香',
  '福丸小糸',
  '市川雛菜',
  '七草にちか',
  '緋田美琴',
  '斑鳩ルカ',
  '鈴木羽那',
  '郁田はるき',
]
const idolOptions: {
  value: string
  label: string
}[] = []
idolOptionKeys.forEach((item) => {
  idolOptions.push({
    value: item,
    label: item,
  })
})

function changedJsonUrlByNumber(jsonUrl: string, change: number) {
  try {
    const splits = jsonUrl.split('/')
    if (splits.length !== 2) return null
    const index = Number(splits[1].split('.')[0])
    return `${splits[0]}/${index + change}.json`
  } catch (e) {
    console.error(e)
    return null
  }
}

async function hasContentForJsonUrl(jsonUrl: string | null) {
  try {
    if (!jsonUrl) return false
    const res = await fetch(getJsonPath(jsonUrl))
    return !!res.ok
  } catch {
    return false
  }
}

// example input: produce_events/100200506.json
async function nextJsonUrl(
  jsonUrl: string,
  eventsCollection: EventsCollectionMeta | null
) {
  if (eventsCollection) {
    const currentIndex = eventsCollection.communications.findIndex(
      (communication) => communication.jsonPath === jsonUrl
    )
    if (currentIndex < 0) throw new Error('unexpected result')
    if (currentIndex === eventsCollection.communications.length - 1) {
      return null
    }
    return eventsCollection.communications[currentIndex + 1].jsonPath
  }
  const rtn = changedJsonUrlByNumber(jsonUrl, 1)
  if (await hasContentForJsonUrl(rtn)) {
    return rtn
  }
  return null
}

// this object is reactive as it is used in computed
const translatedStoryIndex: {
  [key: string]: string
} = reactive({})

async function initTranslatedStoryIndex() {
  const res = await fetch(getGithubRawResourcePath(TRANSLATION_INDEX_URL))
  if (!res.ok) {
    console.error('fetch fail')
    return
  }
  const text = await res.text()
  const raw = JSON.parse(text)
  raw.map((element: any) => {
    translatedStoryIndex[element[0]] = element[1]
  })
}

function queryTranslatedCsv(jsonUrl: string): string | null {
  if (!translatedStoryIndex[jsonUrl]) return null

  const tmp = translatedStoryIndex[jsonUrl]
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')
  return `${TRANSLATION_DIR}/${tmp}`
}

async function queryPreTranslatedCsv(jsonUrl: string): Promise<string | null> {
  if (jsonUrl.startsWith('json/')) {
    jsonUrl = jsonUrl.slice(5)
  }
  const preTranslationPath = `${PRETRANSLATION_DIR}/${jsonUrl.replace(
    '.json',
    '.csv'
  )}`

  const res = await fetch(getGithubRawResourcePath(preTranslationPath))
  console.log(getGithubRawResourcePath(preTranslationPath))
  if (!res.ok) {
    console.log('pretranslation not found')
    return null
  }
  return preTranslationPath
}

// don't need to be reactive
// const rawIndexData: IndexData = reactive({})
let cachedIndexData: null | IndexData = null

async function getIndexData(): Promise<IndexData> {
  if (cachedIndexData) return cachedIndexData
  const res = await fetch(NAME_SERVICE_SERVER)
  if (!res.ok) {
    throw new Error('res not ok')
  }
  const text = await res.text()
  cachedIndexData = JSON.parse(text) as IndexData
  return cachedIndexData
}

function searchIndexData(
  jsonUrl: string,
  indexData: IndexData
): null | EventsCollectionMeta {
  for (const eventCategory of Object.keys(indexData)) {
    for (const eventsCollectionMeta of indexData[eventCategory]) {
      for (const communication of eventsCollectionMeta.communications) {
        if (
          jsonUrl.indexOf(communication.jsonPath) !== -1
          // .split('/')
          // .reverse()[0]
          // .replace('.json', '') === communicationId
        ) {
          return eventsCollectionMeta
        }
      }
    }
  }
  return null
}

function getJsonName(
  jsonUrl: string,
  indexData: IndexData
): {
  eventsCollectionName: string
  communicationName: string
} {
  for (const eventCategory of Object.keys(indexData)) {
    for (const eventsCollectionMeta of indexData[eventCategory]) {
      for (const communication of eventsCollectionMeta.communications) {
        if (jsonUrl.indexOf(communication.jsonPath) !== -1) {
          if (communication.name) {
            return {
              eventsCollectionName: eventsCollectionMeta.name,
              communicationName: `${communication.name}-${communication.title}`,
            }
          }
          return {
            eventsCollectionName: eventsCollectionMeta.name,
            communicationName: `${communication.title}`,
          }
        }
      }
    }
  }
  return {
    eventsCollectionName: '-',
    communicationName: jsonUrl,
  }
}

async function queryCollectionMetaInfo(jsonUrl: string) {
  if (!NAME_SERVICE_SERVER) return null
  const prefix = jsonUrl.substring(0, jsonUrl.length - 7)
  try {
    const res = await axios(`${NAME_SERVICE_SERVER}/${prefix}`)
    return res.data as EventsCollectionMeta
  } catch (e) {
    console.error(e)
    return null
  }
}

async function queryVoices(
  speakers: string[],
  anims: string[],
  pattern: string,
  page = 1,
  pageSize = 20
) {
  try {
    const res = await axios.get(VOICE_SERVICE_SERVER, {
      params: {
        speakers,
        anims,
        pattern,
        page,
        pageSize,
      },
    })
    return res.data as {
      count: number
      results: {
        speaker: string
        text: string
        _id: string
      }[]
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}

async function querySe(se: string, page = 1, pageSize = 20) {
  return {
    count: 0,
    results: [],
  }
  // try {
  //   const res = await axios.get(BGM_SERVICE_SERVER, {
  //     params: {
  //       bgm,
  //       page,
  //       pageSize,
  //     },
  //   })
  // } catch (e) {
  //   console.error(e)
  //   throw e
  // }
}

async function queryBgm(bgm: string, page = 1, pageSize = 20) {
  try {
    const res = await axios.get(BGM_SERVICE_SERVER, {
      params: {
        bgm,
        page,
        pageSize,
      },
    })
    for (const item of res.data.results) {
      const { eventsCollectionName, communicationName } = getJsonName(
        item.jsonPath,
        await getIndexData()
      )
      item.eventsCollectionName = eventsCollectionName
      item.communicationName = communicationName
    }
    return res.data as {
      count: number
      results: {
        bgm: string
        jsonPath: string // starts with "json/"
        eventsCollectionName: string
        communicationName: string
      }[]
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}

async function previousJsonUrl(
  jsonUrl: string,
  eventsCollection: EventsCollectionMeta | null
) {
  if (eventsCollection) {
    const currentIndex = eventsCollection.communications.findIndex(
      (communication) => communication.jsonPath === jsonUrl
    )
    if (currentIndex < 0) throw new Error('unexpected result')
    if (currentIndex === 0) {
      return null
    }
    return eventsCollection.communications[currentIndex - 1].jsonPath
  }
  // performance optimization: block furthur request
  if (jsonUrl.endsWith('01.json')) return null
  const rtn = changedJsonUrlByNumber(jsonUrl, -1)
  if (!(await hasContentForJsonUrl(rtn))) {
    return null
  }
  return rtn
}

// note that self will not be returned
async function trueEndJsonUrl(jsonUrl: string) {
  try {
    const splits = jsonUrl.split('/')
    if (splits.length !== 2) return null
    const index = splits[1].split('.')[0]
    // pcard length
    if (index.length !== 9) return null
    // p card
    if (!index.startsWith('2')) return null
    // already true end
    if (index.endsWith('11')) return null
    const trueEndIndex = `${index.substring(0, 7)}11`
    return `${splits[0]}/${trueEndIndex}.json`
  } catch (e) {
    console.error(e)
    return null
  }
}

// provided when jsonUrl is te to go back to first chapter
async function firstJsonUrl(jsonUrl: string) {
  if (!jsonUrl.endsWith('11.json')) return null
  const rtn = jsonUrl.replace('11.json', '01.json')
  // check if this story has te
  if (!(await trueEndJsonUrl(rtn))) return null
  return rtn
}

// init index
initTranslatedStoryIndex()

async function jsonTextFromPathUrl(url: string): Promise<string> {
  const splits = url.split('/').reverse()
  const relPath = `${splits[1]}/${splits[0]}`
  let realUrl = url
  if (!url.startsWith('https://')) {
    // get remote json source path from relative path
    realUrl = getJsonPath(relPath)
  }
  const response = await fetch(realUrl)
  if (!response.ok) {
    alert('load failed')
    throw new Error('Failed to load json data')
  }
  const jsonText = await response.text()
  return jsonText
}

async function metaInfoFromJsonPathUrl(
  url: string
): Promise<CommunicationDataMeta> {
  const splits = url.split('/').reverse()
  const relPath = `${splits[1]}/${splits[0]}`
  let realUrl = url
  if (!url.startsWith('https://')) {
    // get remote json source path from relative path
    realUrl = getJsonPath(relPath)
  }
  const response = await fetch(realUrl)
  if (!response.ok) {
    alert('load failed')
    throw new Error('Failed to load json data')
  }
  const jsonText = await response.text()
  const text = dataToCSV(JSON.parse(jsonText), null)
  const name = splits[0].replace('.json', '.csv')
  return {
    name,
    text,
  }
}

async function metaInfoFromGithubCsvUrl(
  url: string
): Promise<CommunicationDataMeta> {
  url = getGithubRawResourcePath(url)
  const response = await fetch(url)

  if (!response.ok) {
    alert('load failed')
    throw new Error('Failed to load github csv data')
  }
  if (!url.endsWith('.csv')) {
    alert('file format not supported: specify .csv')
    throw new Error('file format not supported: specify .csv')
  }
  const name = decodeURI(url.split('/').reverse()[0])
  const text = await response.text()
  return {
    name,
    text,
  }
}

export {
  unitList,
  characters,
  NAME_SERVICE_SERVER,
  getAvatarPath,
  getAudioPath,
  getAudioPathFromVoiceId,
  getQueryVariable,
  getRemoteImgPath,
  getIframeSrc,
  extractInfoFromUrl,
  idolOptions,
  getJsonPath,
  nextJsonUrl,
  previousJsonUrl,
  trueEndJsonUrl,
  firstJsonUrl,
  queryTranslatedCsv,
  initTranslatedStoryIndex,
  getGithubRawResourcePath,
  queryCollectionMetaInfo as queryRelated,
  metaInfoFromJsonPathUrl,
  metaInfoFromGithubCsvUrl,
  jsonTextFromPathUrl,
  getCustomJsonPath,
  getIndexData,
  searchIndexData,
  queryVoices,
  queryBgm,
  querySe,
  queryPreTranslatedCsv,
}

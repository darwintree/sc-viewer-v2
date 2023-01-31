import { units } from '../assets/album-index.json'
import { reactive } from 'vue'

let idolList: string[] = []
let unitList: string[] = []

for (let unit of Object.keys(units)) {
    unitList.push(unit)
    let idols = ((units as any)[unit])
    idolList = idolList.concat(idols)
}

function getAvatarPath(name: string) {
    if (idolList.indexOf(name) >= 0) {
        return `/icon/${name}.webp`
    }
    return "/icon/dummy.webp"
}

const ASSETSERVER = 'https://strawberrytree.top/convert/cache'

const TranslationIndexUrl = 'https://raw.githubusercontent.com/biuuu/ShinyColors/gh-pages/story.json'

function getAudioPath(id: string, base: string) {
    return `${ASSETSERVER}/sounds/voice/events/${base}/${id}.m4a`
}

// relPath includes .json postfix
function getJsonPath(relPath: string) {
    return `${ASSETSERVER}/json/${relPath}`
}

function getQueryVariable(variable: string) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
}

// https://github.com/ShinyGroup/SCTranslationData/blob/master/data/story/%E4%B8%89%E5%B3%B0%E7%B5%90%E8%8F%AF/%E3%80%90Hakoni%E2%96%A1a%E3%80%91%E4%B8%89%E5%B3%B0%E7%B5%90%E8%8F%AF/%E3%83%9A%E3%83%AB%E3%82%BD%E3%83%8A%E3%81%AA%E3%82%93%E3%81%A6%E7%AC%91%E3%81%A3%E3%81%A1%E3%82%83%E3%81%86.csv
function extractInfoFromUrl(fileUrl: string) {
    if(fileUrl.startsWith("https://github.com")) {
        const splits = fileUrl.split("/")
        let filePath = splits[7]
        for (let i = 0; i < splits.length; i++) {
            if (i > 7) {
                filePath += "/"
                filePath += splits[i]
            }
        }
        return {
            path: filePath,
            owner: splits[3],
            repo: splits[4]
        }
    }
    throw new Error("wrong prefix")
}

const idolOptionKeys = [
    '283活动剧情', '七草にちか', '三峰結華',
    '八宮めぐる', '和泉愛依',
    '園田智代子',  '大崎甘奈',   '大崎甜花',
    '小宮果穂',    '市川雛菜',   '幽谷霧子',
    '月岡恋鐘',    '有栖川夏葉', '杜野凛世',
    '桑山千雪',    '樋口円香',   '櫻木真乃',
    '浅倉透',      '田中摩美々', '白瀬咲耶',
    '福丸小糸',    '緋田美琴',   '芹沢あさひ',
    '西城樹里',   '風野灯織',    '黛冬優子'
  ]

let idolOptions: any[] = []

idolOptionKeys.forEach((item)=>{
    idolOptions.push({
        value: item,
        label: item
    })
})

function changedJsonUrlByNumber(jsonUrl: string, change: number) {
    try {
        const splits = jsonUrl.split("/")
        if (splits.length !== 2) return null
        let index = Number(splits[1].split(".")[0])
        return `${splits[0]}/${index + change}.json`
    } catch (e) {
        console.log(e)
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
async function nextJsonUrl(jsonUrl: string) {
    const rtn = changedJsonUrlByNumber(jsonUrl, 1)
    if (await hasContentForJsonUrl(rtn)) {
        return rtn
    }
    return null
}

let translatedStoryIndex:{
    [key: string]: string
} = reactive({})

async function initTranslatedStoryIndex() {
    const res = await fetch(TranslationIndexUrl)
    if (!res.ok) {
        console.log("fetch fail")
        return
    }
    const text = await res.text()
    const raw = JSON.parse(text)
    raw.map((element: any) => {
        translatedStoryIndex[element[0]] = element[1]
    })
    // console.log(translatedStoryIndex)
}

function queryTranslatedCsv(jsonUrl: string): string|null {
    if (!translatedStoryIndex[jsonUrl]) return null
    return `https://github.com/biuuu/ShinyColors/blob/gh-pages/data/story/${translatedStoryIndex[jsonUrl]}.csv`
}

async function previousJsonUrl(jsonUrl: string) {
    if (jsonUrl.endsWith("01.json")) return null
    const rtn = changedJsonUrlByNumber(jsonUrl, -1)
    if (jsonUrl.endsWith("11.json") && !await hasContentForJsonUrl(rtn)) {
        return null
    }
    return rtn
}

// note that self will not be returned
async function trueEndJsonUrl(jsonUrl: string) {
    try {
        const splits = jsonUrl.split("/")
        if (splits.length !== 2) return null
        let index = splits[1].split(".")[0]
        // pcard length
        if (index.length !== 9) return null
        // p card
        if (!index.startsWith("2")) return null
        // already true end
        if (index.endsWith("11")) return null
        let trueEndIndex = `${index.substring(0, 7)}11`
        return `${splits[0]}/${trueEndIndex}.json`
    } catch (e) {
        console.log(e)
        return null
    }
}

// provided when jsonUrl is te to go back to first chapter
async function firstJsonUrl(jsonUrl: string) {
    if (!jsonUrl.endsWith("11.json")) return null
    if (await trueEndJsonUrl(jsonUrl)) return null
    return jsonUrl.replace("11.json", "01.json")
}

// init index
initTranslatedStoryIndex()

export {
    getAvatarPath,
    getAudioPath,
    getQueryVariable,
    extractInfoFromUrl,
    idolOptions,
    getJsonPath,
    nextJsonUrl,
    previousJsonUrl,
    trueEndJsonUrl,
    firstJsonUrl,
    queryTranslatedCsv,
    initTranslatedStoryIndex,
}
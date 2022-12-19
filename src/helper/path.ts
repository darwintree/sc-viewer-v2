import { units } from '../assets/album-index.json'

let idolList: string[] = []
let unitList: string[] = []

for (let unit of Object.keys(units)) {
    unitList.push(unit)
    let idols = ((units as any)[unit])
    idolList = idolList.concat(idols)
}

function getAvatarPath(name: string) {
    if (idolList.indexOf(name) > 0) {
        return `/icon/${name}.webp`
    }
    return "/icon/dummy.webp"
}

const ASSETSERVER = 'https://strawberrytree.top/convert/cache'

function getAudioPath(id: string, base: string) {
    return `${ASSETSERVER}/sounds/voice/events/${base}/${id}.m4a`
}

export {
    getAvatarPath,
    getAudioPath,
}
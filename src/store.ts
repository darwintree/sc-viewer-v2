import { reactive } from 'vue'
import { OctokitWrapper } from './helper/auth'
import { EventsCollectionMeta } from './helper/meta-interfaces'
import { DataMode } from './helper/enum-interfaces'

interface Save {
  timeLabel: string
  csv: string
  name: null | string
}

interface SaveManager {
  // id will typically be jsonUrl
  saveDict: {
    [id: string]: Save
  }
  setItem(id: string, save: Save): void
  getItem(id: string): Save | undefined
  removeItem(id: string): void
  clear(): void
}

class LocalStorageSaveManager implements SaveManager {
  constructor(key = 'saves', store: any) {
    // initialize instance variables from localStorage.getItem("saves")
    this.key = key
    this.store = store
    this.loadFromLocalStorage()
  }

  loadFromLocalStorage() {
    const rawSaves = localStorage.getItem(this.key)
    if (!rawSaves) {
      this.saveDict = {}
      return
    }
    this.saveDict = JSON.parse(rawSaves)
    this.store.latestUpdate = localStorage.getItem('latestUpdate') || 'never'
  }

  saveToLocalStorage(update = false) {
    localStorage.setItem(this.key, JSON.stringify(this.saveDict))
    if (update) {
      const timeLabel = new Date().toLocaleString()
      this.store.latestUpdate = timeLabel
      localStorage.setItem('latestUpdate', timeLabel)
    }
  }

  setItem(id: string, save: Save): void {
    // implement setItem method here
    this.saveDict[id] = save
    this.saveToLocalStorage(true)
  }

  getItem(id: string): Save | undefined {
    return this.saveDict[id]
  }

  removeItem(id: string): void {
    delete this.saveDict[id]
    this.saveToLocalStorage()
  }

  clear(): void {
    // implement clear method here
    this.saveDict = {}
    this.saveToLocalStorage()
  }

  saveDict: {
    [id: string]: Save
  } = {}
  key: string
  store: any
}

const store = reactive({
  accessToken: null as string | null,
  isLoading: false,
  isMobile: false,
  // username: null as string | null,
  // avatarUrl: null as string | null,
  base64content: null as string | null,
  octokitWrapper: null as OctokitWrapper | null,

  // used to push to Github
  path: '',

  saves: {} as LocalStorageSaveManager,
  latestUpdate: '',

  currentMode: '' as DataMode,

  // current translation panel info
  csvFilename: '',
  jsonUrl: '', // e.g. produce_events/xxx.json
  eventsCollectionMeta: null as null | EventsCollectionMeta,
})

async function tryLogin() {
  store.accessToken = localStorage.getItem('accessToken')
  if (store.accessToken === null) return
  store.isLoading = true
  try {
    store.octokitWrapper = new OctokitWrapper(store.accessToken)
    await store.octokitWrapper.updateUserMeta()
  } catch (e) {
    alert(e)
    console.error(e)
    logOut()
  }
  store.isLoading = false
}

function logOut() {
  localStorage.removeItem('accessToken')
  store.octokitWrapper = null
}

// ensure savemanager is ready
function syncInit() {
  const saveManager = new LocalStorageSaveManager('saves', store)
  store.saves = saveManager

  store.isMobile = !!navigator.userAgent.match(
    /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
  )
}

async function init() {
  await tryLogin()
}

syncInit()
init()

export { store, tryLogin, logOut }

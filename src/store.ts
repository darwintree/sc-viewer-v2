import { reactive } from 'vue'
import { fetchUserInfo, proxiedGithubUrl } from './helper/auth';

enum DataSourceType {
    Remote = "remote",
    File = "file",
    Storage = "storage"
}

interface Save {
    timeLabel: string,
    csv: string,
}

interface SaveManager {
    saveDict: {
        [name: string]: Save
    }
    setItem(name: string, save: Save): void;
    getItem(name: string): Save | undefined;
    removeItem(name: string): void;
    clear(): void;
}

class LocalStorageSaveManager implements SaveManager {
    constructor(key="saves", store: any) {
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
        this.store.latestUpdate = localStorage.getItem("latestUpdate") || "never"
    }

    saveToLocalStorage(update=false) {
        localStorage.setItem(this.key, JSON.stringify(this.saveDict))
        if (update) {
            const timeLabel = (new Date()).toLocaleString()
            this.store.latestUpdate = timeLabel
            localStorage.setItem("latestUpdate", timeLabel)
        }
    }

    setItem(name: string, save: Save): void {
      // implement setItem method here
        this.saveDict[name] = save
        this.saveToLocalStorage(true)
    }
  
    getItem(name: string): Save | undefined {
        return this.saveDict[name]
    }

    removeItem(name: string): void {
        delete this.saveDict[name]
        this.saveToLocalStorage()
    }
  
    clear(): void {
      // implement clear method here
        this.saveDict = {}
        this.saveToLocalStorage()
    }
  
    saveDict: {
        [name: string]: Save
    } = {}
    key: string
    store: any
}

const store = reactive({
  accessToken: null as string | null,
  isLoading: false,
  username: null as string | null,
  avatarUrl: null as string | null,
  base64content: null as string | null,
  owner: "ShinyGroup",
  repo: "SCTranslationData",
  path: "",
  saves: {} as LocalStorageSaveManager,
  latestUpdate: "",
  setAvatarUrl(currentAvatarUrl: string|null) {
    if (currentAvatarUrl === null) {
        this.avatarUrl = null
        return
    }
    this.avatarUrl = proxiedGithubUrl(currentAvatarUrl, true)
  },
  currentDataSourceType: "file" as DataSourceType,
})

async function tryLogin() {

    store.accessToken = localStorage.getItem("accessToken")
    if (!store.accessToken) return
    
    store.isLoading = true
    try {
        const userInfo = await fetchUserInfo(store.accessToken!)
        store.username = userInfo.login
        store.setAvatarUrl(userInfo.avatar_url)
    } catch (e){
        alert(e)
        console.log(e)
        logOut()
    }
    store.isLoading = false
}

function logOut() {
    localStorage.removeItem("accessToken")
    store.username = null;
    store.avatarUrl = null;
}

// ensure savemanager is ready
function syncInit(){
    const saveManager = new LocalStorageSaveManager("saves", store)
    store.saves = saveManager
}

async function init() {
    await tryLogin()
}

syncInit()
init()

export {
    store,
    tryLogin,
    logOut
};

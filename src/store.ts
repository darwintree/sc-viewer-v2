import { userInfo } from 'os';
import { reactive } from 'vue'
import { fetchUserInfo, proxiedGithubUrl } from './helper/auth';

const store = reactive({
  accessToken: null as string | null,
  isLoading: false,
  username: null as string | null,
  avatarUrl: null as string | null,
  base64content: null as string | null,
  owner: "ShinyGroup",
  repo: "SCTranslationData",
  path: "",
  setAvatarUrl(currentAvatarUrl: string|null) {
    if (currentAvatarUrl === null) {
        this.avatarUrl = null
        return
    }
    this.avatarUrl = proxiedGithubUrl(currentAvatarUrl, true)
  },
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

tryLogin()

export {
    store,
    tryLogin,
    logOut
};

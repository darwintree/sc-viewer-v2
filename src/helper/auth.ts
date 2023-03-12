import axios from "axios";

const clientId = process.env.NODE_ENV === 'development' ? '160aaa1e1eaa7deebce9' : 'd3fe73d4d944c0972530';

const clientSecret = process.env.NODE_ENV === 'development' ? '0a25442a292cad8db226fe4e363d3f858bb6cc90' : 'caff67d9071f6ef6db79ecdc1cab9b3a964489d7';

const defaultGithubProxy = "https://strawberrytree.top"
const useGithubProxy = true
const cancelLoginUrl = `https://github.com/settings/connections/applications/${clientId}`

const endpoints = {
  accessToken: () => "https://github.com/login/oauth/access_token",
  user: () => "https://api.github.com/user",
  fork: (owner: string, repo: string) => `https://api.github.com/repos/${owner}/${repo}/forks`,
  content: (owner: string, repo: string, path: string) => `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
}

function generateState() {
  return Math.floor(Math.random() * Date.now());
}

function generateAuthRequest(state: number) {
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo+read:user&state=${state}`
}

function proxiedGithubUrl(githubUrl: string, letPass = false) {
  if (!useGithubProxy) {
    return githubUrl;
  }
  if (githubUrl.startsWith("https://github.com")) {
    return githubUrl.replace("https://github.com", `${defaultGithubProxy}/github`)
  }
  if (githubUrl.startsWith("https://api.github.com")) {
    return githubUrl.replace("https://api.github.com", `${defaultGithubProxy}/api`)
  }
  if (!letPass)
    throw new Error(`Not a github url: ${githubUrl}`)
  return githubUrl
}

async function fetchAccessToken(code: string) {
  const endpointUrl = proxiedGithubUrl(endpoints.accessToken())
  let response = await axios.post(
    endpointUrl, {
    code,
    client_id: clientId,
    client_secret: clientSecret,
  }, {
    headers: {
      'Accept': 'application/json',
    }
  })
  // console.log(response.data)
  return response.data.access_token
}

function githubApiHeaders(accessToken: string) {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${accessToken}`,
    "X-GitHub-Api-Version": "2022-11-28"
  }
}

async function fetchUserInfo(accessToken: string) {
  const endpointUrl = proxiedGithubUrl(endpoints.user())
  const response = await axios.get(
    endpointUrl, {
    headers: githubApiHeaders(accessToken)
  }
  )
  console.log(response.status)
  return response.data
}

async function forkBranch(accessToken: string, owner = "ShinyGroup", repo = "SCTranslationData") {
  const endpointUrl = proxiedGithubUrl(
    endpoints.fork(owner, repo)
  )
  const response = await axios.post(
    endpointUrl, {}, {
    headers: githubApiHeaders(accessToken)
  }
  )
  return response.data
}

async function getContent(accessToken: string, path: string, owner = "ShinyGroup", repo = "SCTranslationData") {
  const endpointUrl = proxiedGithubUrl(
    endpoints.content(owner, repo, path)
  )
  const response = await axios.get(
    endpointUrl, {
    headers: githubApiHeaders(accessToken)
  }
  )
  return response.data
}

async function updateContent(accessToken: string, path: string, message: string, content: string, owner = "ShinyGroup", repo = "SCTranslationData") {
  const endpointUrl = proxiedGithubUrl(
    endpoints.content(owner, repo, path)
  )
  let sha = null;
  try {
    const existedContent = await getContent(accessToken, path, owner, repo)
    sha = existedContent.sha;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      console.log("original resource not found, creating file...")
    } else {
      console.error(e)
      throw (e)
    }
  }
  const response = await axios.put(
    endpointUrl, {
    message,
    content,
    sha,
  }, {
    headers: githubApiHeaders(accessToken)
  }
  )
  return response.data
}

export {
  generateState,
  generateAuthRequest,
  fetchAccessToken,
  fetchUserInfo,
  proxiedGithubUrl,
  forkBranch,
  getContent,
  updateContent,
}

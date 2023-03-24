import axios from 'axios'
import { RequestInterface } from '@octokit/types'
// @ts-ignore
import { Octokit } from 'https://cdn.skypack.dev/octokit'

const clientId =
  process.env.NODE_ENV === 'development'
    ? '160aaa1e1eaa7deebce9'
    : 'd3fe73d4d944c0972530'

const clientSecret =
  process.env.NODE_ENV === 'development'
    ? '0a25442a292cad8db226fe4e363d3f858bb6cc90'
    : 'caff67d9071f6ef6db79ecdc1cab9b3a964489d7'

const defaultGithubProxy = 'https://strawberrytree.top'
const useGithubProxy = true
const cancelLoginUrl = `https://github.com/settings/connections/applications/${clientId}`
const rootRepoName =
  process.env.NODE_ENV === 'development'
    ? 'SCTranslationDataTest'
    : 'SCTranslationData'
const rootOwner =
  process.env.NODE_ENV === 'development' ? 'sc-viewer' : 'ShinyGroup'
const rootBranch = 'master'

interface BranchComparison {
  aheadBy: number
  behindBy: number
  status: 'diverged' | 'ahead' | 'behind' | 'identical'
}

class OctokitWrapper {
  request: RequestInterface
  headers = {
    'X-GitHub-Api-Version': '2022-11-28',
    'Cache-Control': 'private, no-store, max-age=0',
  }
  userMeta: {
    username: string
    avatarUrl: string
  } | null = null

  constructor(accessToken: string, baseUrl = `${defaultGithubProxy}/api`) {
    const octokit = new Octokit({
      auth: accessToken,
      baseUrl,
    })
    this.request = octokit.request
  }

  async updateUserMeta() {
    this.userMeta = await this.getUserMeta()
  }

  async getUserMeta() {
    const { data } = await this.request('GET /user', {
      headers: this.headers,
    })
    return {
      username: data.login,
      avatarUrl: data.avatar_url,
    }
  }

  // select information to use from data
  async getRepoMeta(owner: string, repo: string) {
    const { data } = await this.request('GET /repos/{owner}/{repo}', {
      owner,
      repo,
      headers: this.headers,
    })
    return data
  }

  async createFork(owner: string, repo: string) {
    const { data } = await this.request('POST /repos/{owner}/{repo}/forks', {
      owner,
      repo,
      default_branch_only: true,
      headers: this.headers,
    })
    return data
  }

  // TODO: return compared commits info (ahead)
  async getCompare(
    owner: string,
    repo: string,
    base: string,
    head: string
  ): Promise<BranchComparison> {
    const { data } = await this.request(
      'GET /repos/{owner}/{repo}/compare/{basehead}',
      {
        owner,
        repo,
        basehead: `${base}...${head}`,
        headers: this.headers,
      }
    )
    console.log(data)
    return {
      aheadBy: data.ahead_by,
      behindBy: data.behind_by,
      status: data.status,
    }
  }

  async listBrancheNames(owner: string, repo: string) {
    const { data } = await this.request('GET /repos/{owner}/{repo}/branches', {
      owner,
      repo,
      headers: this.headers,
    })
    return data.map((item) => item.name)
  }

  async syncBranch(owner: string, repo: string, branch: string) {
    const { data } = await this.request(
      'POST /repos/{owner}/{repo}/merge-upstream',
      {
        owner,
        repo,
        branch,
        headers: this.headers,
      }
    )
    return data
  }

  async createRef(
    owner: string,
    repo: string,
    branch: string,
    sourceOwner: string,
    sourceRepo: string,
    sourceBranch: string
  ) {
    const { data } = await this.request(
      'GET /repos/{owner}/{repo}/git/ref/{ref}',
      {
        owner: sourceOwner,
        repo: sourceRepo,
        ref: `heads/${sourceBranch}`,
        headers: this.headers,
      }
    )

    await this.request('POST /repos/{owner}/{repo}/git/refs', {
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: data['object'].sha,
      headers: this.headers,
    })
  }

  // to test
  async forceSyncRef(
    owner: string,
    repo: string,
    branch: string,
    sourceOwner: string,
    sourceRepo: string,
    sourceBranch: string
  ) {
    const { data } = await this.request(
      'GET /repos/{owner}/{repo}/git/ref/{ref}',
      {
        owner: sourceOwner,
        repo: sourceRepo,
        ref: `heads/${sourceBranch}`,
        headers: this.headers,
      }
    )

    await this.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: data['object'].sha,
      force: true,
      headers: this.headers,
    })
  }

  async getContent(owner: string, repo: string, path: string) {
    const { data } = await this.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner,
        repo,
        path,
        headers: this.headers,
      }
    )
    return data
  }

  async updateContent(
    owner: string,
    repo: string,
    path: string,
    message: string,
    content: string
  ) {
    let sha = null
    try {
      const previousData = await this.getContent(owner, repo, path)
      // @ts-ignore
      sha = previousData.sha
    } catch (e: any) {
      if (e?.response?.status === 404) {
        console.log('original resource not found, creating file...')
      } else {
        console.error(e)
        throw e
      }
    }

    const { data } = await this.request(
      'PUT /repos/{owner}/{repo}/contents/{path}',
      {
        owner,
        repo,
        path,
        sha,
        message,
        content,
        headers: this.headers,
      }
    )
    return data
  }

  async getOpenPR(owner: string, repo: string, head: string) {
    const { data } = await this.request('GET /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      state: 'open',
      head,
      headers: this.headers,
    })
    return data
  }

  async createPR(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ) {
    const { data } = await this.request('POST /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      title,
      body,
      head,
      base,
      headers: this.headers,
    })

    return data
  }
}

const endpoints = {
  accessToken: () => 'https://github.com/login/oauth/access_token',
  user: () => 'https://api.github.com/user',
  fork: (owner: string, repo: string) =>
    `https://api.github.com/repos/${owner}/${repo}/forks`,
  content: (owner: string, repo: string, path: string) =>
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
  compare: (owner: string, repo: string, base: string, head: string) =>
    `https://api.github.com/repos/${owner}/${repo}/compare/${base}...${head}`,
  repo: (owner: string, repo: string) =>
    `https://api.github.com/repos/${owner}/${repo}`,
}

function generateState() {
  return Math.floor(Math.random() * Date.now())
}

function generateAuthRequest(state: number) {
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo+read:user&state=${state}`
}

function proxiedGithubUrl(githubUrl: string, letPass = false) {
  if (!useGithubProxy) {
    return githubUrl
  }
  if (githubUrl.startsWith('https://github.com')) {
    return githubUrl.replace(
      'https://github.com',
      `${defaultGithubProxy}/github`
    )
  }
  if (githubUrl.startsWith('https://api.github.com')) {
    return githubUrl.replace(
      'https://api.github.com',
      `${defaultGithubProxy}/api`
    )
  }
  if (!letPass) throw new Error(`Not a github url: ${githubUrl}`)
  return githubUrl
}

async function fetchAccessToken(code: string) {
  const endpointUrl = proxiedGithubUrl(endpoints.accessToken())
  let response = await axios.post(
    endpointUrl,
    {
      code,
      client_id: clientId,
      client_secret: clientSecret,
    },
    {
      headers: {
        Accept: 'application/json',
      },
    }
  )
  // console.log(response.data)
  return response.data.access_token
}

function githubApiHeaders(accessToken: string) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${accessToken}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function fetchUserInfo(accessToken: string) {
  const endpointUrl = proxiedGithubUrl(endpoints.user())
  const response = await axios.get(endpointUrl, {
    headers: githubApiHeaders(accessToken),
  })
  console.log(response.status)
  return response.data
}

// async function forkBranch(
//   accessToken: string,
//   owner = 'ShinyGroup',
//   repo = 'SCTranslationData'
// ) {
//   const endpointUrl = proxiedGithubUrl(endpoints.fork(owner, repo))
//   const response = await axios.post(
//     endpointUrl,
//     {},
//     {
//       headers: githubApiHeaders(accessToken),
//     }
//   )
//   return response.data
// }

// async function getContent(
//   accessToken: string,
//   path: string,
//   owner = 'ShinyGroup',
//   repo = 'SCTranslationData'
// ) {
//   const endpointUrl = proxiedGithubUrl(endpoints.content(owner, repo, path))
//   const response = await axios.get(endpointUrl, {
//     headers: githubApiHeaders(accessToken),
//   })
//   return response.data
// }

// async function updateContent(
//   accessToken: string,
//   path: string,
//   message: string,
//   content: string,
//   owner = 'ShinyGroup',
//   repo = 'SCTranslationData'
// ) {
//   const endpointUrl = proxiedGithubUrl(endpoints.content(owner, repo, path))
//   let sha = null
//   try {
//     const existedContent = await getContent(accessToken, path, owner, repo)
//     sha = existedContent.sha
//   } catch (e: any) {
//     if (e?.response?.status === 404) {
//       console.log('original resource not found, creating file...')
//     } else {
//       console.error(e)
//       throw e
//     }
//   }
//   const response = await axios.put(
//     endpointUrl,
//     {
//       message,
//       content,
//       sha,
//     },
//     {
//       headers: githubApiHeaders(accessToken),
//     }
//   )
//   return response.data
// }

export {
  OctokitWrapper,
  generateState,
  generateAuthRequest,
  fetchAccessToken,
  fetchUserInfo,
  proxiedGithubUrl,
  forkBranch,
  getContent,
  updateContent,
  rootRepoName,
  rootOwner,
  rootBranch,
}
export type { BranchComparison }

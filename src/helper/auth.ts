import axios from 'axios'
import { RequestInterface } from '@octokit/types'
// @ts-ignore
import { Octokit } from 'https://cdn.skypack.dev/octokit'

const clientId =
  process.env.NODE_ENV === 'development'
    ? import.meta.env.VITE_DEV_CLIENT_ID
    : import.meta.env.VITE_CLIENT_ID

// this is a pure frontend application
// so it's ok to expose client secret
const clientSecret =
  process.env.NODE_ENV === 'development'
    ? import.meta.env.VITE_DEV_CLIENT_SECRET
    : import.meta.env.VITE_CLIENT_SECRET

const GITHUB_PROXY = import.meta.env.VITE_GITHUB_PROXY // used to fetch access token
const GITHUB_API_PROXY = import.meta.env.VITE_GITHUB_API_PROXY
// const defaultGithubProxy = 'https://strawberrytree.top'
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

  constructor(accessToken: string, baseUrl = GITHUB_API_PROXY) {
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

  async getContent(owner: string, repo: string, branch: string, path: string) {
    const { data } = await this.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner,
        repo,
        branch,
        path,
        headers: this.headers,
      }
    )
    return data
  }

  async updateContent(
    owner: string,
    repo: string,
    branch: string,
    path: string,
    message: string,
    content: string
  ) {
    let sha = null
    try {
      const previousData = await this.getContent(owner, repo, branch, path)
      // @ts-ignore
      sha = previousData.sha
    } catch (e: any) {
      if (e?.response?.status === 404) {
        // console.log('original resource not found, creating file...')
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
        branch,
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
    return githubUrl.replace('https://github.com', GITHUB_PROXY)
  }
  if (!letPass) throw new Error(`Not a github url: ${githubUrl}`)
  return githubUrl
}

async function fetchAccessToken(code: string) {
  const endpointUrl = proxiedGithubUrl(endpoints.accessToken())
  const response = await axios.post(
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

export {
  OctokitWrapper,
  generateState,
  generateAuthRequest,
  fetchAccessToken,
  rootRepoName,
  rootOwner,
  rootBranch,
}
export type { BranchComparison }

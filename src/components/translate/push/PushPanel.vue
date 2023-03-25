// User.vue

<template>
  <n-space vertical class="user-container">
    <div v-if="!store.octokitWrapper?.userMeta">
      <!-- TODO：提醒需要管理员权限 -->
      <button class="btn btn-primary" @click="navToAuth">
        Login via Github
      </button>
    </div>
    <div
      v-if="!store.isLoading && store.octokitWrapper?.userMeta"
      class="full-width"
    >
      <div class="user-info-line">
        <div class="user-info">
          <img
            v-if="store.octokitWrapper?.userMeta.avatarUrl"
            class="avatar"
            :src="store.octokitWrapper?.userMeta.avatarUrl"
            alt="User avatar"
          />
          <span class="username">{{
            store.octokitWrapper?.userMeta.username
          }}</span>
        </div>
        <button class="btn btn-secondary" @click="logOut">Logout</button>
      </div>
      <n-collapse>
        <n-collapse-item title="不熟悉 git 工作流？">
          <p>
            使用Github进行协作就像是一群人共同编辑一份文档。为了避免每个人直接在原文档上修改而导致混乱，我们采取了一种分步骤的方法。
          </p>

          <p>
            想象一下，有一篇原始文章，我们可以为其创建草稿进行修改，最后将草稿的内容呈现给原文作者审查并合并。
          </p>
          <ol>
            <li>
              选择工作分支：创建一个新的草稿（工作分支）或选择一个现有草稿。<br />这样你可以专注于自己的任务，无论是新增内容还是修正现有内容，都不会影响到原始文章和其他人的工作。
            </li>
            <li>
              将内容上传到分支：将你的本地工作成果保存到自己的云端草稿中。
            </li>
            <li>
              提交合并请求：请求将你的修改从草稿（工作分支）合并回原始文章。<br />这个过程允许文章作者审查你的修改，并在合并前确保内容是正确的。
            </li>
          </ol>
        </n-collapse-item>
      </n-collapse>
      <push-steps></push-steps>
    </div>
  </n-space>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { generateState, generateAuthRequest } from '../../../helper/auth'
import { store, tryLogin, logOut } from '../../../store'
import { NCollapse, NCollapseItem, NSpace } from 'naive-ui'
import PushSteps from './PushSteps.vue'

// const current = ref(1)
// const currentStatus = ref('Finish')
// const current

async function handleVisibilityChangeAfterAuth() {
  if (document.hidden) return
  if (!localStorage.getItem('accessToken')) return
  await tryLogin()
  document.removeEventListener(
    'visibilitychange',
    handleVisibilityChangeAfterAuth
  )
}

function navToAuth() {
  const state = generateState()
  localStorage.setItem('state', state.toString())
  // console.log(state)
  window.open(generateAuthRequest(state))
  document.addEventListener(
    'visibilitychange',
    handleVisibilityChangeAfterAuth,
    false
  )
}
</script>

<style scoped>
.n-collapse {
  margin: 10px;
}

.full-width {
  width: 100%;
}

/* .user-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
} */

.logged-out {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.logged-in {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.user-info-line {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  margin-left: 10px;
  font-size: 1.2em;
}

.avatar {
  height: 50px;
  border-radius: 50%;
}

.commit-card {
  width: 100%;
}
</style>

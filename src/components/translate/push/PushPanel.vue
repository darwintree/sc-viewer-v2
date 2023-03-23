// User.vue

<template>
  <div vertical class="user-container">
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
      <push-steps></push-steps>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { generateState, generateAuthRequest } from '../../../helper/auth'
import { store, tryLogin, logOut } from '../../../store'
import { NSpace } from 'naive-ui'
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
  console.log(state)
  window.open(generateAuthRequest(state))
  document.addEventListener(
    'visibilitychange',
    handleVisibilityChangeAfterAuth,
    false
  )
}
</script>

<style scoped>
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

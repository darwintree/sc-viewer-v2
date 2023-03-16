// User.vue

<template>
  <div class="user-container">
    <div v-if="!store.username">
      <button class="btn btn-primary" @click="navToAuth">
        Login via Github
      </button>
    </div>
    <div v-if="!store.isLoading && store.username" class="full-width">
      <div class="user-info-line">
        <div class="user-info">
          <img
            v-if="store.avatarUrl"
            class="avatar"
            :src="store.avatarUrl"
            alt="User avatar"
          />
          <span class="username">{{ store.username }}</span>
        </div>
        <button class="btn btn-secondary" @click="logOut">Logout</button>
      </div>
      <commit-card v-if="store.path"></commit-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { generateState, generateAuthRequest } from '../../../helper/auth'
import { store, tryLogin, logOut } from '../../../store'
import CommitCard from './CommitCard.vue'

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

.user-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

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

<template>
  <n-space align="center">
    <span>Push to Github</span>
    <n-popconfirm
      v-if="!store.octokitWrapper?.userMeta"
      :positive-text="t('common.confirm')"
      :negative-text="t('common.cancel')"
      @positive-click="navToAuth"
    >
      <template #trigger>
        <n-button type="info">
          <template #icon><LogoGithub /></template>
          Login
        </n-button>
      </template>
      需要获取私人仓库的读写权限
    </n-popconfirm>
    <n-dropdown v-else :options="options" @select="handleSelect">
      <n-tag class="clickable">
        <template #avatar>
          <n-avatar
            round
            :src="store.octokitWrapper?.userMeta.avatarUrl"
          ></n-avatar>
        </template>
        {{ store.octokitWrapper?.userMeta.username }}
      </n-tag>
    </n-dropdown>
  </n-space>
</template>
<script setup lang="ts">
import {
  NSpace,
  NTag,
  NAvatar,
  NButton,
  NDropdown,
  NPopconfirm,
} from 'naive-ui'
import { LogoGithub } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'
import { store, tryLogin, logOut } from '../../../store'
import { generateState, generateAuthRequest } from '../../../helper/auth'

const { t } = useI18n()
const options = [
  {
    label: '登出',
    key: 'logout',
  },
]

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

function handleSelect(key: string | number) {
  console.log(key)
  if (key === 'logout') {
    logOut()
  }
}
</script>
<style scoped>
.clickable {
  cursor: pointer;
}
</style>

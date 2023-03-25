<template>
  <n-space align="center">
    <span> {{ t('push.header.title') }}</span>
    <n-popconfirm
      v-if="!store.octokitWrapper?.userMeta"
      :positive-text="t('common.confirm')"
      :negative-text="t('common.cancel')"
      @positive-click="navToAuth"
    >
      <template #trigger>
        <n-button type="info">
          <template #icon><LogoGithub /></template>
          {{ t('push.header.login') }}
        </n-button>
      </template>
      {{ t('push.header.scope') }}
    </n-popconfirm>
    <n-button
      v-if="isAuthorizing"
      size="medium"
      secondary
      type="info"
      @click="handleVisibilityChangeAfterAuth"
    >
      <template #icon>
        <Renew />
      </template>
      {{ t('push.header.refresh') }}
    </n-button>
    <n-dropdown
      v-if="!!store.octokitWrapper?.userMeta"
      :options="options"
      @select="handleSelect"
    >
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
import { ref } from 'vue'
import {
  NSpace,
  NTag,
  NAvatar,
  NButton,
  NDropdown,
  NPopconfirm,
} from 'naive-ui'
import { LogoGithub, Renew } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'
import { store, tryLogin, logOut } from '../../../store'
import { generateState, generateAuthRequest } from '../../../helper/auth'

const { t } = useI18n()
const isAuthorizing = ref(false)
const options = [
  {
    label: t('push.header.logout'),
    key: 'logout',
  },
]

async function handleVisibilityChangeAfterAuth() {
  if (document.hidden) return
  if (!localStorage.getItem('accessToken')) return
  await tryLogin()
  isAuthorizing.value = false
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
  isAuthorizing.value = true
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

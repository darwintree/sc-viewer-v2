<template>
  <n-collapse :default-expanded-names="['saves']">
    <n-collapse-item :title="t('home.history.title')" name="saves">
      <history-saves />
      <template #header-extra>
        <n-tag type="info" size="small">
          {{ latestUpdate }}
        </n-tag>
      </template>
    </n-collapse-item>
    <n-collapse-item :title="t('home.updates')" name="updates">
      <div class="changelog" v-html="updatesHtml"></div>
      <template #header-extra>
        <n-tag type="info" size="small">
          {{ updatesBrief }}
        </n-tag>
      </template>
    </n-collapse-item>
    <n-collapse-item :title="t('home.changelog')" name="changelog">
      <div class="changelog" v-html="changelogHtml"></div>
      <template #header-extra>
        <n-tag type="info" size="small">
          {{ changelogBrief }}
        </n-tag>
      </template>
    </n-collapse-item>
  </n-collapse>
  <n-modal
    v-model:show="showUpdateModal"
    preset="dialog"
    :title="t('home.updates')"
    size="huge"
    :show-icon="false"
    type="info"
    :bordered="false"
  >
    <div class="changelog" v-html="updatesHtml"></div>
  </n-modal>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCollapse, NCollapseItem, NTag, NModal } from 'naive-ui'
import { store } from '../../store'
import HistorySaves from './HistorySaves.vue'
import { inject } from '@vercel/analytics'

inject()

const changelogHtml = ref('')
const changelogBrief = ref('')
const updatesHtml = ref('')
const updatesBrief = ref('')
const showUpdateModal = ref(false)
const { t } = useI18n()

const latestUpdate = computed(() => store.latestUpdate)

onMounted(() => {
  loadChangelog()
  loadGameUpdates()
})

async function loadChangelog() {
  const res = await fetch('./CHANGELOG.html')
  if (!res.ok) {
    console.error('CHNANGELOG Missing')
    return
  }
  const text = await res.text()
  const regex = /<h2>(.*?)<\/h2>/
  const match = regex.exec(text)
  changelogHtml.value = text.replace(/<h1>.*?<\/h1>/, '')
  changelogBrief.value = `latest update: ${match![1]}`
}

// latestVisit: a date string
// latestGame: a date string with no time
function visitedAfterUpdate(
  latestVisit: string | null,
  latestGameUpdate: string
) {
  if (!latestVisit) return false
  return new Date(latestVisit) > new Date(`${latestGameUpdate} 14:00:00`)
}

async function loadGameUpdates() {
  const res = await fetch('./GAMEUPDATES.html')
  if (!res.ok) {
    console.error('CHNANGELOG Missing')
    return
  }
  const text = await res.text()
  const regex = /<h2>(.*?)<\/h2>/
  const match = regex.exec(text)
  updatesHtml.value = text.replace(/<h1>.*?<\/h1>/, '')
  updatesBrief.value = `latest update: ${match![1]}`

  const latestVisit = localStorage.getItem('latestVisit')
  console.log(`latest visit: ${latestVisit}`)
  if (!visitedAfterUpdate(latestVisit, updatesBrief.value)) {
    showUpdateModal.value = true
  }
  localStorage.setItem('latestVisit', new Date().toLocaleString())
}
</script>
<style scoped>
.changelog {
  text-align: left;
}
</style>

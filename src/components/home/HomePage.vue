<template>
  <main class="home-panel">
    <nav aria-label="首页模块">
      <button
        v-for="item in sections"
        :key="item.key"
        :class="{ active: activeSection === item.key }"
        :aria-pressed="activeSection === item.key"
        type="button"
        @click="activeSection = item.key"
      >
        <span>{{ item.label }}</span>
        <small>{{ item.meta }}</small>
      </button>
    </nav>

    <section>
      <history-saves v-if="activeSection === 'history'" />
      <div
        v-else-if="activeSection === 'updates'"
        class="panel-content"
        v-html="updatesHtml"
      ></div>
      <div v-else class="panel-content" v-html="changelogHtml"></div>
    </section>
  </main>

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
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { inject } from '@vercel/analytics'
import { NModal } from 'naive-ui'
import { store } from '../../store'
import HistorySaves from './HistorySaves.vue'

type HomeSection = 'history' | 'updates' | 'changelog'
type HomeSectionItem = {
  key: HomeSection
  label: string
  meta: string
}

inject()

const { t } = useI18n()
const activeSection = ref<HomeSection>('history')
const changelogHtml = ref('')
const changelogBrief = ref('')
const updatesHtml = ref('')
const updatesBrief = ref('')
const showUpdateModal = ref(false)
const sections = computed<HomeSectionItem[]>(() => [
  {
    key: 'history',
    label: t('home.history.title'),
    meta: store.latestUpdate,
  },
  {
    key: 'updates',
    label: t('home.updates'),
    meta: updatesBrief.value,
  },
  {
    key: 'changelog',
    label: t('home.changelog'),
    meta: changelogBrief.value,
  },
])

onMounted(() => {
  loadChangelog()
  loadGameUpdates()
})

async function loadChangelog(): Promise<void> {
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
): boolean {
  if (!latestVisit) return false
  return new Date(latestVisit) > new Date(`${latestGameUpdate} 14:00:00`)
}

async function loadGameUpdates(): Promise<void> {
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
.home-panel {
  overflow: hidden;
  border: 1px solid rgb(205 218 230 / 92%);
  border-radius: 18px;
  background: rgb(255 255 255 / 88%);
  box-shadow: 0 14px 36px rgb(62 83 105 / 10%);
  text-align: left;
  backdrop-filter: blur(10px);
}

nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid #dae3eb;
  background: rgb(246 250 253 / 82%);
}

button {
  display: grid;
  gap: 3px;
  margin: 0;
  padding: 18px 20px;
  border: 0;
  border-right: 1px solid #dae3eb;
  border-radius: 0;
  background: transparent;
  color: #657386;
  text-align: left;
}

button:last-child {
  border-right: 0;
}

button.active {
  box-shadow: inset 0 -3px #bf486b;
  background: white;
  color: #2c3949;
}

button span {
  font-weight: 700;
}

small {
  overflow: hidden;
  color: #8b98a7;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

section {
  min-height: 390px;
  padding: 24px;
}

.panel-content {
  max-height: 520px;
  overflow: auto;
  color: #536173;
  font-size: 13px;
}

.changelog {
  text-align: left;
}

@media (max-width: 600px) {
  nav {
    grid-template-columns: 1fr;
  }

  button {
    padding: 11px 14px;
    border-right: 0;
    border-bottom: 1px solid #dae3eb;
  }

  button.active {
    box-shadow: inset 3px 0 #bf486b;
  }

  section {
    min-height: 280px;
    padding: 16px 12px;
  }
}
</style>

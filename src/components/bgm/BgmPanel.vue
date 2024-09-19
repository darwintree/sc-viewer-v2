<template>
  <div>
    <n-space vertical justify="center">
      <n-input-group>
        <n-button @click="decreaseIndex">←</n-button>
        <n-select v-model:value="audioType" :options="audioOptions" />
        <n-button @click="increaseIndex">→</n-button>
      </n-input-group>
      <n-input-group>
        <n-input
          v-model:value="audioInput"
          :placeholder="audioType === 'bgm' ? 'BGM Index' : 'SE Index'"
          clearable
          @keydown.enter="changeAudio"
        />
        <n-button type="info" @click="changeAudio">Search</n-button>
      </n-input-group>
      <n-space v-if="audioPath" vertical>
        <AVWaveform :src="audioPath" :playtime-clickable="false"></AVWaveform>
        <n-data-table
          remote
          striped
          class="communication-list-table"
          :columns="columns"
          :data="data"
          :loading="loading"
          :bordered="false"
          :pagination="paginationReactive"
          @update:page="fetchData"
      /></n-space>
      <span v-else> 未选择{{ audioType === 'bgm' ? 'BGM' : 'EVENT SE' }} </span>
    </n-space>
  </div>
</template>
<script setup lang="ts">
import {
  NSpace,
  NInput,
  NInputGroup,
  NButton,
  NDataTable,
  NSelect,
} from 'naive-ui'
import { AVWaveform } from 'vue-audio-visual'
import { computed, h, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { queryBgm, querySe } from '../../helper/path'
import { store } from '../../store'
import { DataSource } from '../../helper/enum-interfaces'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const PAGE_SIZE = store.isMobile ? 10 : 15
const paginationReactive = reactive({
  page: 1,
  pageCount: 1,
  pageSize: PAGE_SIZE,
})
const data = ref(
  [] as {
    bgm: string
    jsonPath: string
    eventsCollectionName: string
    communicationName: string
  }[]
)

const audioType = ref('bgm')
const audioOptions = [
  { label: 'BGM', value: 'bgm' },
  { label: 'EVENT SE', value: 'se' },
]
const audioInput = ref('')
const audio = ref('')
const audioPath = computed(() => {
  const pathPrefix = audioType.value === 'bgm' ? 'bgm' : 'se/event'
  return audio.value
    ? `https://service.sc-viewer.top/convert/cache/sounds/${pathPrefix}/${audio.value}.m4a`
    : null
})

async function fetchData(page: number) {
  loading.value = true
  try {
    const queryFunction = audioType.value === 'bgm' ? queryBgm : querySe
    const result = await queryFunction(
      audio.value,
      page,
      paginationReactive.pageSize
    )
    console.log(result)
    data.value = result.results
    paginationReactive.pageCount =
      Math.floor((result.count - 1) / PAGE_SIZE) + 1
    paginationReactive.page = page
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function changeAudio() {
  audio.value = ''
  nextTick(async () => {
    audio.value = audioInput.value
    router.replace({
      query: {
        type: audioType.value,
        bgmIndex: audio.value,
      },
    })
    await fetchData(1)
  })
}

function decreaseIndex() {
  const currentIndex = parseInt(audioInput.value)
  if (!isNaN(currentIndex) && currentIndex > 0) {
    audioInput.value = (currentIndex - 1)
      .toString()
      .padStart(audioInput.value.length, '0')
    changeAudio()
  }
}

function increaseIndex() {
  const currentIndex = parseInt(audioInput.value)
  if (!isNaN(currentIndex)) {
    audioInput.value = (currentIndex + 1)
      .toString()
      .padStart(audioInput.value.length, '0')
    changeAudio()
  }
}

watch(
  () => route.query,
  (newQuery) => {
    const { type, bgmIndex } = newQuery
    if (type === 'bgm' || type === 'se') {
      audioType.value = type
      if (bgmIndex) {
        audioInput.value = bgmIndex.toString()
        audio.value = bgmIndex.toString()
        fetchData(1)
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (!route.query.type) {
    router.replace({
      query: {
        ...route.query,
        type: 'bgm',
      },
    })
  }
})

const createColumns = (): any => {
  const base = [
    {
      title: 'Event',
      align: store.isMobile ? 'center' : undefined,
      render(row: { eventsCollectionName: string }) {
        const quoteIndex = row.eventsCollectionName.search('】')
        let innerHTML = row.eventsCollectionName
        if (quoteIndex >= 0) {
          innerHTML =
            innerHTML.slice(0, quoteIndex + 1) +
            '<br />' +
            innerHTML.slice(quoteIndex + 1)
        }

        return h('span', {
          innerHTML,
        })
      },
    },
    {
      width: store.isMobile ? '180' : undefined,
      title: 'Communication',
      render(row: { communicationName: string; jsonPath: string }) {
        const innerHTML = row.communicationName

        let onClick = undefined
        onClick = () => {
          router.push({
            path: '/translate',
            query: {
              forceReload: '1',
              source: DataSource.Remote,
            },
            hash: `#${row.jsonPath}`,
          })
        }
        const style = {
          color: undefined,
          cursor: 'pointer',
        }

        return h('a', {
          innerHTML,
          onClick,
          style,
        })
      },
    },
  ]
  return base
}

const columns = ref(createColumns())
</script>

<style scoped>
.info-container {
  text-align: left;
}
</style>

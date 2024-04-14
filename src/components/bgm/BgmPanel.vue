<template>
  <div>
    <n-space vertical justify="center">
      <n-input-group>
        <n-input
          v-model:value="bgmInput"
          placeholder="BGM Index"
          clearable
          @keydown.enter="changeBgm"
        />
        <n-button type="info" @click="changeBgm">search</n-button>
      </n-input-group>
      <n-space v-if="bgmPath" vertical>
        <AVWaveform :src="bgmPath" :playtime-clickable="false"></AVWaveform>
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
      <span v-else> No BGM selected </span>
    </n-space>
  </div>
</template>
<script setup lang="ts">
import { NSpace, NInput, NInputGroup, NButton, NDataTable } from 'naive-ui'
import { AVWaveform } from 'vue-audio-visual'
import { computed, h, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { queryBgm } from '../../helper/path'
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

const bgmInput = ref('')
const bgm = ref('')
const bgmPath = computed(() =>
  bgm.value
    ? `https://service.sc-viewer.top/convert/cache/sounds/bgm/${bgm.value}.m4a`
    : null
)

async function fetchData(page: number) {
  loading.value = true
  try {
    const result = await queryBgm(
      bgm.value,
      page, // use specified page
      paginationReactive.pageSize
    )
    console.log(result)
    data.value = result.results
    paginationReactive.pageCount =
      Math.floor((result.count - 1) / PAGE_SIZE) + 1
    // paginationReactive.itemCount = result.count
    paginationReactive.page = page
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function changeBgm() {
  bgm.value = ''
  nextTick(async () => {
    bgm.value = bgmInput.value
    router.replace({
      query: {
        bgmIndex: bgm.value,
      },
    })
    await fetchData(1)
  })
}

onMounted(async () => {
  const bgmQuery = route.query.bgmIndex
  if (bgmQuery != null) {
    bgmInput.value = bgmQuery.toString()
    bgm.value = bgmQuery.toString()
    await fetchData(1)
  }
})

const createColumns = (): any => {
  const base = [
    {
      title: 'Event',
      // key: 'eventsCollectionName',
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
          // href,
        })
      },
    },
    {
      width: store.isMobile ? '180' : undefined,
      title: 'Communication',
      render(row: { communicationName: string; jsonPath: string }) {
        let innerHTML = row.communicationName

        let onClick = undefined
        onClick = () => {
          router.push({
            path: '/translate',
            query: {
              forceReload: '1',
              source: DataSource.Remote,
            },
            // do not use encodeURIComponent
            hash: `#${row.jsonPath}`,
          })
        }
        const style = {
          color: undefined,
          cursor: 'pointer',
        }

        return h('a', {
          innerHTML,
          // href,
          onClick,
          style,
        })
      },
      // align: 'center',
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

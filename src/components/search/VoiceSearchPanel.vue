<template>
  <div class="filter-group">
    <NInputGroup>
      <NInputGroupLabel :style="{ width: '25%' }">Speaker</NInputGroupLabel>
      <n-select
        v-model:value="speakerOptions"
        multiple
        :options="availableSpeakerOptions"
        clearable
      />
    </NInputGroup>
    <NInputGroup>
      <NInput
        v-model:value="pattern"
        placeholder="Input text pattern to search"
        clearable
      ></NInput>
      <NButton type="info" :disabled="!pattern" @click="newFetch">
        search
      </NButton>
    </NInputGroup>
  </div>
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
  />
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted, reactive } from 'vue'
import {
  NDataTable,
  NSelect,
  NInputGroup,
  NInputGroupLabel,
  NInput,
  NButton,
  NTag,
} from 'naive-ui'
import AudioLabel from '../translate/AudioLabel.vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { store } from '../../store'
import { DataSource } from '../../helper/enum-interfaces'
import { EventsCollectionMeta, IndexData } from '../../helper/meta-interfaces'
import {
  getRemoteImgPath,
  unitList,
  characters,
  queryTranslatedCsv,
  getIndexData,
  queryVoices,
} from '../../helper/path'
import { inject } from '@vercel/analytics'

inject()

interface VoiceMeta {
  speaker: string
  text: string
  _id: string
}

const PAGE_SIZE = store.isMobile ? 10 : 15

const pattern = ref('')

const paginationReactive = reactive({
  page: 1,
  pageCount: 1,
  pageSize: PAGE_SIZE,
})

const loading = ref(false)
const data = ref([] as VoiceMeta[])

async function newFetch() {
  paginationReactive.page = 1
  await fetchData(1)
}

async function fetchData(page: number) {
  loading.value = true
  try {
    const result = await queryVoices(
      speakerOptions.value,
      pattern.value,
      page, // use specified page
      paginationReactive.pageSize
    )
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

const availableSpeakerOptions = characters
  .filter((item) => Number(item.id) <= 28 || item.id === '32')
  .map((item) => {
    return {
      value: item.firstName,
      label: item.firstName,
    }
  })

const speakerOptions = ref([] as string[])

function getEventIdFromVoiceId(_id: string) {
  const parts = _id.split('/')
  return `${parts[0]}/${parts[1]}.json`
}

function extractAudioLabelPropFromVoiceId(_id: string) {
  const parts = _id.split('/')
  return {
    id: parts[2],
    base: `${parts[0]}/${parts[1]}`,
  }
}

const router = useRouter()
const { t } = useI18n()

const createColumns = (): any => {
  const base = [
    {
      title: 'speaker',
      key: '_id',
      render(row: VoiceMeta) {
        return h(AudioLabel, {
          ...extractAudioLabelPropFromVoiceId(row._id),
          extraText: row.speaker,
        })
      },
      align: 'center',
      width: store.isMobile ? 90 : 120,
    },
    {
      title: 'text',
      render(row: VoiceMeta) {
        const quoteIndex = row.text.search('\n')
        let innerHTML = row.text
        if (quoteIndex >= 0) {
          innerHTML =
            innerHTML.slice(0, quoteIndex + 1) +
            '<br />' +
            innerHTML.slice(quoteIndex + 1)
        }

        let onClick = undefined
        onClick = () => {
          inject({
            beforeSend: (event) => {
              event.url = event.url.replace('/search', '/search-navigate')
              return event
            },
          })
          router.push({
            path: '/translate',
            query: {
              forceReload: '1',
              source: DataSource.Remote,
            },
            // do not use encodeURIComponent
            hash: `#${getEventIdFromVoiceId(row._id)}`,
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
.communication-list-table {
  font-size: x-small;
  font-weight: lighter;
}

.filter-group {
  margin-bottom: 10px;
}
</style>

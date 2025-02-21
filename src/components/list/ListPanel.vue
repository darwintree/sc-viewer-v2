<template>
  <div class="filter-group">
    <NInputGroup>
      <NInputGroupLabel :style="{ width: '25%' }">Common</NInputGroupLabel>
      <n-select
        v-model:value="characterFilterOptions"
        multiple
        :options="availableCharacterFilterOptions"
        clearable
      />
    </NInputGroup>
    <NInputGroup>
      <NInputGroupLabel :style="{ width: '25%' }">Produce</NInputGroupLabel>
      <n-select
        v-model:value="produceFilterOptions"
        multiple
        :options="availableProduceFilterOptions"
        clearable
      />
    </NInputGroup>
    <NInputGroup>
      <NInputGroupLabel :style="{ width: '25%' }">Support</NInputGroupLabel>
      <n-select
        v-model:value="supportFilterOptions"
        multiple
        :options="availableSupportFilterOptions"
        clearable
      />
    </NInputGroup>
    <NInputGroup>
      <NInputGroupLabel :style="{ width: '25%' }">Event</NInputGroupLabel>
      <n-select
        v-model:value="gameEventFilterOptions"
        multiple
        :options="availableGameEventFilterOptions"
        clearable
      />
    </NInputGroup>
  </div>
  <n-data-table
    class="communication-list-table"
    :columns="columns"
    :data="filteredData"
    :bordered="false"
    :pagination="pagination"
  />
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import {
  NDataTable,
  NSelect,
  NImage,
  NInputGroup,
  NInputGroupLabel,
  NTag,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { store } from '../../store'
import { DataSource, EventCategory } from '../../helper/enum-interfaces'
import { EventsCollectionMeta, IndexData } from '../../helper/meta-interfaces'
import {
  getRemoteImgPath,
  unitList,
  characters,
  queryTranslatedCsv,
  getIndexData,
} from '../../helper/path'
import { inject } from '@vercel/analytics'

inject()

enum FilterField {
  unitId = 'unitId',
  characterId = 'characterId',
}

type FilterOption = {
  eventsCategory: EventCategory
  filterField: FilterField
  value: string
}

function filteredCommunicationMetaList(
  indexData: IndexData,
  filterOption: FilterOption
): EventsCollectionMeta[] {
  return indexData[filterOption.eventsCategory].filter(
    (eventsCommunicationMeta: EventsCollectionMeta) => {
      return (
        eventsCommunicationMeta[filterOption.filterField] === filterOption.value
      )
    }
  )
}

const pagination = ref({
  pageSize: 5,
})

type FilterSelectOption = {
  label: string
  value: FilterOption
}

const rawIndexData = ref({} as IndexData)
const characterFilterOptions = ref([] as any)
const availableCharacterFilterOptions = ref([] as any)
const produceFilterOptions = ref([] as any)
const availableProduceFilterOptions = ref([] as any)
const supportFilterOptions = ref([] as any)
const availableSupportFilterOptions = ref([] as any)
const gameEventFilterOptions = ref([] as any)
const availableGameEventFilterOptions = ref([] as any)

function getLabel(filterField: FilterField, value: number) {
  switch (filterField) {
    case FilterField.unitId:
      return unitList[value]
    case FilterField.characterId:
      return characters.find((character) => character.id === value.toString())!
        .firstName
  }
}

function initAvailableOptions(
  availableOptions: FilterSelectOption[],
  {
    from,
    to,
    filterField,
    eventsCategory,
  }: {
    from: number
    to: number
    filterField: FilterField
    eventsCategory: EventCategory
  }
) {
  for (let i = from; i < to + 1; i++) {
    availableOptions.push({
      label: getLabel(filterField, i),
      value: {
        eventsCategory,
        filterField,
        value: `${i}`,
      },
    })
  }
}

initAvailableOptions(availableCharacterFilterOptions.value, {
  from: 1,
  to: 28,
  filterField: FilterField.characterId,
  eventsCategory: EventCategory.characterEvents,
})
// initAvailableOptions(availableCharacterFilterOptions.value, {
//   from: 1,
//   to: 8,
//   filterField: FilterField.unitId,
//   eventsCategory: EventCategory.characterEvents,
// })
initAvailableOptions(availableProduceFilterOptions.value, {
  from: 1,
  to: 8,
  filterField: FilterField.unitId,
  eventsCategory: EventCategory.produceIdolEvents,
})
initAvailableOptions(availableProduceFilterOptions.value, {
  from: 1,
  to: 28,
  filterField: FilterField.characterId,
  eventsCategory: EventCategory.produceIdolEvents,
})
initAvailableOptions(availableSupportFilterOptions.value, {
  from: 1,
  to: 8,
  filterField: FilterField.unitId,
  eventsCategory: EventCategory.supportIdolEvents,
})
initAvailableOptions(availableSupportFilterOptions.value, {
  from: 1,
  to: 28,
  filterField: FilterField.characterId,
  eventsCategory: EventCategory.supportIdolEvents,
})
initAvailableOptions(availableGameEventFilterOptions.value, {
  from: 0,
  to: 8,
  filterField: FilterField.unitId,
  eventsCategory: EventCategory.gameEvents,
})

const filterOptions = computed(() => {
  return [].concat(
    characterFilterOptions.value,
    produceFilterOptions.value,
    supportFilterOptions.value,
    gameEventFilterOptions.value
  )
})

onMounted(async () => {
  rawIndexData.value = await getIndexData()
})

const filteredData = computed(() => {
  if (Object.keys(rawIndexData.value).length === 0) return []
  const filteredSet = new Set<EventsCollectionMeta>()
  filterOptions.value
    .map((filterOption: FilterOption) => {
      return filteredCommunicationMetaList(rawIndexData.value, filterOption)
    })
    .forEach((eventsCollectionMetas: EventsCollectionMeta[]) => {
      eventsCollectionMetas.forEach((element) => {
        filteredSet.add(element)
      })
    })
  return [...filteredSet]
})

const router = useRouter()
const { t } = useI18n()

const createColumns = (): any => {
  const base = [
    {
      title: t('list.icon'),
      key: 'thumb',
      render(row: EventsCollectionMeta) {
        return h(NImage, {
          width: '72',
          src: getRemoteImgPath(row.thumb),
        })
      },
      align: 'center',
    },
    {
      title: t('list.name'),
      key: 'name',
      render(row: EventsCollectionMeta) {
        const quoteIndex = row.name.search('】')
        let innerHTML = row.name
        if (quoteIndex >= 0) {
          innerHTML =
            innerHTML.slice(0, quoteIndex + 1) +
            '<br />' +
            innerHTML.slice(quoteIndex + 1)
        }

        let onClick = undefined
        let style = {
          color: 'grey' as any,
          cursor: undefined as any,
        }
        if (row.communications.length > 0) {
          onClick = () => {
            inject({
              beforeSend: (event) => {
                event.url = event.url.replace('/list', '/navigate')
                return event
              },
            })
            router.push({
              path: '/translate',
              query: {
                forceReload: '1',
                source: DataSource.Remote,
                id: row.communications[0].jsonPath,
              },
              // do not use encodeURIComponent
              // hash: `#${row.communications[0].jsonPath}`,
            })
          }
          style = {
            color: undefined,
            cursor: 'pointer',
          }
        }

        return h('a', {
          innerHTML,
          // href,
          onClick,
          style,
        })
      },
      align: 'center',
    },
    {
      title: t('list.translatedStatus.title'),
      render(row: EventsCollectionMeta) {
        const version = store.isMobile ? 'short' : 'full'
        const translatedStatus = computed(() => {
          if (row.communications.length === 0)
            return {
              type: 'default',
              text: t(`list.translatedStatus.${version}.empty`),
            }
          const translatedUrls = row.communications.map((communication) =>
            queryTranslatedCsv(communication.jsonPath)
          )
          if (translatedUrls.every(Boolean))
            return {
              type: 'success',
              text: t(`list.translatedStatus.${version}.all`),
            }
          if (translatedUrls.some(Boolean))
            return {
              type: 'warning',
              text: t(`list.translatedStatus.${version}.part`),
            }
          return {
            type: 'error',
            text: t(`list.translatedStatus.${version}.no`),
          }
        })
        return h(
          NTag as any,
          {
            type: translatedStatus.value.type,
          },
          {
            default: () => translatedStatus.value.text,
          }
        )
      },
      align: 'center',
    },
    {
      title: t('list.openAt'),
      key: 'openAt',
      defaultSortOrder: 'descend',
      sorter: 'default',
      render(row: EventsCollectionMeta) {
        return h(
          'div',
          new Date(row.openAt * 1000)
            .toLocaleString('jp')
            .split(' ')[0]
            .substring(2)
        )
      },
      width: '90',
      align: 'center',
    },
  ]
  // if (store.isMobile) {
  //   base.splice(2, 1)
  // }
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

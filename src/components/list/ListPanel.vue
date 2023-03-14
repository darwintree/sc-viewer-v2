<template>
  <div class="filter-group">
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
  NButton,
  NDataTable,
  NSelect,
  NImage,
  NInputGroup,
  NInputGroupLabel,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { DataSourceType } from '../../store'
import { EventsCollectionMeta, IndexData } from '../../helper/meta-interfaces'
import {
  getRemoteImgPath,
  unitList,
  characters,
  NAME_SERVICE_SERVER,
} from '../../helper/path'

enum EventCategory {
  produceIdolEvents = 'produceIdolEvents',
  supportIdolEvents = 'supportIdolEvents',
  gameEvents = 'gameEvents',
  specialEvents = 'specialEvents',
}

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
  pageSize: 6,
})

type FilterSelectOption = {
  label: string
  value: FilterOption
}

const rawIndexData = ref({} as IndexData)
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

initAvailableOptions(availableProduceFilterOptions.value, {
  from: 1,
  to: 7,
  filterField: FilterField.unitId,
  eventsCategory: EventCategory.produceIdolEvents,
})
initAvailableOptions(availableProduceFilterOptions.value, {
  from: 1,
  to: 25,
  filterField: FilterField.characterId,
  eventsCategory: EventCategory.produceIdolEvents,
})
initAvailableOptions(availableSupportFilterOptions.value, {
  from: 1,
  to: 7,
  filterField: FilterField.unitId,
  eventsCategory: EventCategory.supportIdolEvents,
})
initAvailableOptions(availableSupportFilterOptions.value, {
  from: 1,
  to: 25,
  filterField: FilterField.characterId,
  eventsCategory: EventCategory.supportIdolEvents,
})
initAvailableOptions(availableGameEventFilterOptions.value, {
  from: 0,
  to: 7,
  filterField: FilterField.unitId,
  eventsCategory: EventCategory.gameEvents,
})

const filterOptions = computed(() => {
  return [].concat(
    produceFilterOptions.value,
    supportFilterOptions.value,
    gameEventFilterOptions.value
  )
})

onMounted(async () => {
  const res = await fetch(NAME_SERVICE_SERVER)
  if (!res.ok) {
    return
  }
  const text = await res.text()
  rawIndexData.value = JSON.parse(text)
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
            router.push({
              path: '/translate',
              query: {
                forceReload: '1',
                mode: DataSourceType.Raw,
              },
              // do not use encodeURIComponent
              hash: `#${row.communications[0].jsonPath}`,
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
      title: t('list.openAt'),
      key: 'openAt',
      defaultSortOrder: 'descend',
      sorter: 'default',
      render(row: EventsCollectionMeta) {
        return h(
          'div',
          new Date(row.openAt * 1000).toLocaleString().split(' ')[0]
        )
      },
      width: '120',
      align: 'center',
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

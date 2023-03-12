<template>
  <n-data-table
    class="history-table"
    :columns="columns"
    :data="saveBriefData"
    :bordered="false"
  />

  <n-popconfirm
    :positive-text="t('common.confirm')"
    :negative-text="t('common.cancel')"
    @positive-click="store.saves.clear()"
  >
    <template #trigger>
      <n-button primary type="error">{{ t('home.history.clear') }}</n-button>
    </template>
    {{ t('home.history.clearWarning') }}
  </n-popconfirm>
</template>

<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { NButton, NDataTable, NPopconfirm } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { store, DataSourceType } from '../../store'

type SaveBrief = {
  name: string // the file name
  id: string // the id that indicates the save in localstorage
  timeLabel: string
}

const saveBriefData = computed(() => {
  const rtn = []
  for (const id of Object.keys(store.saves.saveDict)) {
    rtn.push({
      name: store.saves.saveDict[id].name || id,
      id,
      timeLabel: store.saves.saveDict[id].timeLabel,
    })
  }
  return rtn
})

const router = useRouter()
const { t } = useI18n()

const createColumns = ({
  navigate,
}: {
  navigate: (row: SaveBrief) => void
}): any => {
  const base = [
    {
      title: t('home.history.table.name'),
      key: 'name',
      render(row: SaveBrief) {
        return h(
          NButton,
          {
            text: true,
            tag: 'a',
            type: 'primary',
            onClick: () => navigate(row),
          },
          {
            default: () => row.name,
          }
        )
      },
    },
    {
      title: t('home.history.table.URL'),
      key: 'id',
    },
    {
      title: t('home.history.table.latestUpdate'),
      key: 'timeLabel',
      defaultSortOrder: 'descend',
      sorter: 'default',
    },
  ]
  if (store.isMobile) {
    base.splice(1, 1)
  }
  return base
}

const columns = ref(
  createColumns({
    navigate(row: SaveBrief) {
      router.push({
        path: '/translate',
        query: {
          forceReload: '1',
          mode: DataSourceType.History,
        },
        // do not use encodeURIComponent
        hash: `#${row.id}`,
      })
    },
  })
)
</script>

<style scoped>
.history-table {
  font-size: x-small;
  font-weight: lighter;
}

.n-button {
  margin: 10px;
}
</style>

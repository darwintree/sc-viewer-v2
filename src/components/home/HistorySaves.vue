<template>
  <n-data-table class="history-table" :columns="columns" :data="saveBriefData" :bordered="false" striped />

  <n-popconfirm @positive-click="store.saves.clear()">
    <template #trigger>
      <n-button primary type="error">CLEAR HISTORY</n-button>
    </template>
    Will Clear All History
  </n-popconfirm>
</template>

<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { NButton, NDataTable, NPopconfirm } from 'naive-ui'
import { useRouter } from 'vue-router'
import { store, DataSourceType } from '../../store'

type SaveBrief = {
  name: string, // the file name
  id: string, // the id that indicates the save in localstorage
  timeLabel: string,
}

const saveBriefData = computed(() => {
  const rtn = []
  for (let id of Object.keys(store.saves.saveDict)) {
    rtn.push({
      name: store.saves.saveDict[id].name || id,
      id,
      timeLabel: store.saves.saveDict[id].timeLabel
    })
  }
  return rtn
})

const router = useRouter()

const createColumns = ({
  navigate,
}: {
  navigate: (row: SaveBrief) => void,
}): any => {
  const base = [
    {
      title: 'Name',
      key: 'name',
      render(row: SaveBrief) {
        return h(
          NButton,
          {
            text: true,
            tag: "a",
            type: "primary",
            onClick: () => navigate(row)
          },
          {
            default: () => row.name
          }
        )
      }
    },
    {
      title: "URL",
      key: 'id',
    },
    {
      title: 'Latest Update',
      key: 'timeLabel',
      defaultSortOrder: 'descend',
      sorter: 'default'
    }
  ]
  if (store.isMobile) {
    base.splice(1, 1)
  }
  return base
}


let columns = ref(createColumns({
  navigate(row: SaveBrief) {
    router.push({
      path: "/translate",
      query: {
        "forceReload": "1",
        "mode": DataSourceType.History
      },
      // do not use encodeURIComponent
      hash: `#${row.id}`
    })
  }
}))
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

<template>
  <n-data-table :columns="columns" :data="saveBriefData" :bordered="false" />
</template>

<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { NButton, NDataTable } from 'naive-ui'
import { useRouter } from 'vue-router'
import { store } from '../../store'
import type { DataTableColumns } from 'naive-ui'

type SaveBrief = {
  name: string,
  timeLabel: string,
}

const saveBriefData = computed(() => {
  const rtn = []
  for (let name of Object.keys(store.saves.saveDict)) {
    rtn.push({
      name,
      timeLabel: store.saves.saveDict[name].timeLabel
    })
  }
  return rtn
})

const router = useRouter()

const createColumns = ({
  navigate,
}: {
  navigate: (row: SaveBrief) => void,
}): DataTableColumns<SaveBrief> => {
  return [
    {
      title: 'Name',
      key: 'name',
      render(row) {
        return h(
          NButton,
          {
            // strong: true,
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
      title: 'Latest Update',
      key: 'timeLabel',
    }
  ]
}


let columns = ref(createColumns({
  navigate(row: SaveBrief) {
  router.push({
    path: "/translate",
    query: {
      "forceReload": "1",
      "mode": "storage"
    },
    hash: `#${encodeURIComponent(row.name)}`
  })
}
}))
</script>

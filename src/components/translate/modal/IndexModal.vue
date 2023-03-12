// setter for store.csvFilename

<script setup lang="ts">
import { computed } from 'vue'
import { NModal, NImage, NSpace, NMenu } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { store } from '../../../store'
import { getRemoteImgPath } from '../../../helper/path'
import { suggestedCommunicationName } from '../../../helper/meta-interfaces'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'change-chapter', jsonUrl: string): void
  (e: 'close'): void
}>()

const props = defineProps({
  showModal: Boolean,
})

const show = computed({
  get() {
    return props.showModal
  },
  set(newVal) {
    if (newVal === false) {
      emit('close')
    }
  },
})

const menuOptions = computed(() => {
  const tmp = [] as MenuOption[]
  store.eventsCollectionMeta?.communications.forEach((communicationMeta) => {
    tmp.push({
      label: suggestedCommunicationName(communicationMeta),
      key: communicationMeta.jsonPath,
    })
  })
  return tmp
})

// key: jsonPath
function changeChapter(key: string, item: MenuOption) {
  emit('close')
  emit('change-chapter', key)
}
</script>
<template>
  <n-modal
    v-model:show="show"
    preset="card"
    style="width: 600px; max-width: 100%"
    :title="t('translate.rename.title')"
  >
    <template #header>
      <n-space align="center">
        <n-image
          height="75"
          :src="getRemoteImgPath(store.eventsCollectionMeta?.thumb!)"
        />
        {{ store.eventsCollectionMeta?.name }}
      </n-space>
    </template>
    <n-menu :options="menuOptions" @update-value="changeChapter"></n-menu>
  </n-modal>
</template>

// setter for store.csvFilename

<script setup lang="ts">

import { defineProps, ref, computed, defineEmits } from "vue";
import { NInput, NModal, NButton, NInputGroup, NTooltip } from "naive-ui";
import { store } from "../../store";
import { useI18n } from "vue-i18n";

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'close-csv-filename-setter',): void
  (e: 'save',): void
}>()

const props = defineProps({
  showModal: Boolean,
  extraInfo: String,
})

const show = computed({
  get() {
    tmpCsvFilename.value = store.csvFilename;
    return props.showModal
  },
  set(newVal) {
    if (newVal === false) {
      emit('close-csv-filename-setter')
    }
  }
})

const tmpCsvFilename = ref("");

tmpCsvFilename.value = store.csvFilename;

const disabled = computed(() => {
  return !tmpCsvFilename.value.endsWith(".csv")
})

function setCsvFilename() {
  store.csvFilename = tmpCsvFilename.value
  emit('save')
  emit('close-csv-filename-setter')
}

const suggestedFilename = computed(() => {
  if (store.jsonUrl && store.eventsCollectionMeta) {
    for (let communication of store.eventsCollectionMeta.communications) {
      if (communication.jsonPath == store.jsonUrl) {
        if (communication.name) {
          return `${communication.name}-${communication.title}.csv`
        }
        return `${communication.title}.csv`
      }
    }
  }
  return null
})

const defaultFilename = computed(() => {
  return store.jsonUrl.split("/").reverse()[0].replace(".json", ".csv")
})

</script>
<template>
  <n-modal v-model:show="show" :mask-closable=false preset="card" style="width: 600px; max-width: 100%"
    :title='t("translate.rename.title")'>
    <n-input-group>
      <n-input v-model:value="tmpCsvFilename" placeholder="csv filename(.csv)"></n-input>
      <n-button type="info" @click="setCsvFilename" :disabled="disabled">{{ t('common.confirm') }}</n-button>
    </n-input-group>
    <template #footer>
      <n-input-group>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button secondary type="warning" @click="tmpCsvFilename = defaultFilename">{{
              t('translate.rename.defaultName')
            }}</n-button>
          </template>
          {{ defaultFilename }}
        </n-tooltip>
        <n-tooltip>
          <template #trigger>
            <n-button secondary type="success" tag="div" :disabled="!suggestedFilename"
              @click="tmpCsvFilename = suggestedFilename!">{{
                t('translate.rename.originName') }}</n-button>
          </template>
          {{ suggestedFilename ? suggestedFilename : t("translate.rename.originNameNotFound") }}
        </n-tooltip>
      </n-input-group>
    </template>
  </n-modal>
</template>

// setter for store.csvFilename

<script setup lang="ts">

import { defineProps, ref, computed, defineEmits } from "vue";
import { NInput, NModal, NButton, NInputGroup } from "naive-ui";
import { store } from "../../store";

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

const disabled = computed(()=>{
  return !tmpCsvFilename.value.endsWith(".csv")
})

function setCsvFilename() {
  store.csvFilename = tmpCsvFilename.value
  emit('save')
  emit('close-csv-filename-setter')
}

</script>
<template>
  <n-modal v-model:show="show" :mask-closable=false preset="card" style="width: 600px; max-width: 100%" title="更改文件名">
    <n-input-group>
      <n-input v-model:value="tmpCsvFilename" placeholder="csv filename(.csv)"></n-input>
      <n-button type="info" @click="setCsvFilename" :disabled="disabled">confirm</n-button>
    </n-input-group>
    <template #header-extra>
    </template>
    <template #footer>
      <n-input-group>
        <n-button secondary type="warning">use default</n-button>
        <n-button secondary type="success">use recommended</n-button>
      </n-input-group>
    </template>
  </n-modal>
</template>

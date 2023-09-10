<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal,
  NButton,
  NSpace,
  NInput,
  NRadioGroup,
  NRadio,
  NPopconfirm,
  NSwitch,
  NInputNumber,
} from 'naive-ui'
import PushHeader from '../push/PushHeader.vue'
import { store } from '../../../store'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'update:showModal', newVal: boolean): void
}>()

const props = defineProps<{
  showModal: boolean
  doTranslate: (
    token: string,
    batchSize: number,
    withTag: boolean
  ) => Promise<void>
  currentDialogueCount: number
}>()

const show = computed({
  get() {
    return props.showModal
  },
  set(newVal) {
    emit('update:showModal', newVal)
  },
})

const batchSize = ref(25)

const authType = ref('github')
const manualOpenAiKey = ref(localStorage.getItem('openai_key') || '')
const usePretranslationTag = ref(true)

watch(manualOpenAiKey, (newVal) => {
  localStorage.setItem('openai_key', newVal)
})

const currentDialogueCount = computed(() => {
  return props.currentDialogueCount
})

// 101 -> 26
// 100 -> 25
watch(currentDialogueCount, (newVal) => {
  const recommendedBatchSize = 4
  batchSize.value = Math.max(
    Math.min(Math.ceil(newVal / recommendedBatchSize), 40),
    25
  )
})

const token = computed(() => {
  switch (authType.value) {
    case 'github':
      return store.accessToken
    case 'openai':
      return manualOpenAiKey.value
    default:
      return null
  }
})

async function beginTranslate() {
  if (!token.value) {
    return
  }
  if (authType.value === 'openai' && !token.value.startsWith('sk-')) {
    alert('invalid openai api token: openai api key should start with "sk-""')
    return
  }
  show.value = false
  await props.doTranslate(
    token.value,
    batchSize.value,
    usePretranslationTag.value
  )
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
      <n-space align="center" :wrap="false">
        <span>{{ t('translate.preTranslate.options') }}</span>
      </n-space>
    </template>
    <n-space vertical>
      <n-radio-group v-model:value="authType" name="radiogroup">
        <n-space vertical>
          <n-space align="center">
            <n-radio value="github">
              {{ t('translate.preTranslate.useGithubToken') }}
            </n-radio>
            <push-header title=""></push-header>
          </n-space>
          <span class="explanation">
            {{ t('translate.preTranslate.githubWarning') }}
          </span>
          <n-space align="center">
            <n-radio value="openai">{{
              t('translate.preTranslate.useAPIKey')
            }}</n-radio>
            <n-input
              v-model:value="manualOpenAiKey"
              type="password"
              show-password-on="click"
            />
          </n-space>
          <span class="explanation">
            {{ t('translate.preTranslate.keyWarning') }}
          </span>
        </n-space>
      </n-radio-group>
      <n-space
        ><span>{{ t('translate.preTranslate.appendTag') }}</span
        ><n-switch v-model:value="usePretranslationTag"
      /></n-space>
      <n-space align="center">
        <span>Batch Size</span>
        <n-input-number v-model:value="batchSize" :min="20" :max="40" />
      </n-space>
      <span class="explanation">
        {{ currentDialogueCount }} lines divided into
        {{ Math.ceil(currentDialogueCount / batchSize) }} batches ({{
          batchSize
        }}
        lines per batch)</span
      >
      <n-space justify="end">
        <n-popconfirm
          :positive-text="t('common.confirm')"
          :negative-text="t('common.cancel')"
          @positive-click="beginTranslate"
        >
          <template #trigger>
            <n-button type="info" :disabled="!token">{{
              t('translate.preTranslate.translate')
            }}</n-button>
          </template>
          {{ t('translate.preTranslate.generalTooltip') }}
        </n-popconfirm>
      </n-space>
    </n-space>
  </n-modal>
</template>
<style scoped>
/* span {
  word-break: normal;
  width: auto;
  display: block;
  white-space: pre-wrap;
  word-wrap: break-word;
} */

.explanation {
  font-size: 0.9em;
  color: #999;
}
</style>

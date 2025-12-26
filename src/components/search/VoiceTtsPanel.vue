<template>
  <n-space vertical size="medium" class="tts-panel">
    <n-alert
      v-if="!genieBase"
      type="warning"
      title="服务未配置"
      :show-icon="false"
    >
      请设置环境变量 `VITE_GENIE_SERVER` 指向 Genie TTS 服务地址。
    </n-alert>

    <n-card title="参考音频" size="small" class="tts-card tts-card-compact">
      <n-space vertical size="small">
        <n-space justify="space-between" align="center" size="small" wrap>
          <n-input
            v-model:value="referenceSpeaker"
            placeholder="Speaker"
            readonly
            size="small"
            class="reference-speaker"
          />
          <div class="reference-audio-inline">
            <AudioLabel
              v-if="referenceAudioProps"
              v-bind="referenceAudioProps"
              extra-text="点击播放"
            />
            <div v-else class="status-value">未选择</div>
          </div>
        </n-space>
        <n-input
          v-model:value="referenceText"
          type="textarea"
          placeholder="Reference Text"
          readonly
          :autosize="{ minRows: 2, maxRows: 4 }"
          size="small"
        />
        <n-alert v-if="!hasReference" type="warning" :show-icon="false">
          尚未选择参考音频，请从搜索页选择后进入。
        </n-alert>
      </n-space>
    </n-card>

    <n-card title="TTS 生成" size="small" class="tts-card">
      <n-space vertical size="small">
        <n-input
          v-model:value="ttsText"
          type="textarea"
          placeholder="请输入要生成的文本"
          :autosize="{ minRows: 3, maxRows: 6 }"
          size="small"
        />
        <n-space justify="space-between" align="center">
          <n-button
            type="primary"
            :loading="submitting"
            :disabled="!canSubmit"
            size="small"
            @click="createTask"
          >
            发送请求
          </n-button>
          <n-button v-if="taskId" size="small" @click="fetchTaskStatus">
            立即刷新
          </n-button>
        </n-space>
        <n-alert v-if="errorMessage" type="error" :show-icon="false">
          {{ errorMessage }}
        </n-alert>
      </n-space>
    </n-card>

    <n-card v-if="taskId" title="任务状态" size="small" class="tts-card">
      <n-space vertical size="small">
        <div class="status-header">
          <n-tag :type="currentStatusMeta.type" size="small" round>
            <template #icon>
              <n-icon>
                <component :is="currentStatusMeta.icon" />
              </n-icon>
            </template>
            {{ currentStatusMeta.label }}
          </n-tag>
          <div class="status-meta">
            <span class="status-label">发送时间</span>
            <span class="status-value">{{ sentAtLabel }}</span>
          </div>
          <div v-if="showPending" class="status-meta">
            <span class="status-label">排队</span>
            <span class="status-value">{{ taskStatus?.pending ?? 0 }}</span>
          </div>
        </div>
        <div v-if="sentTtsText.trim()" class="status-meta status-text">
          <span class="status-label">TTS 文本</span>
          <span class="status-value">{{ sentTtsText }}</span>
        </div>
        <div v-if="sentSpeaker" class="status-meta">
          <span class="status-label">Speaker</span>
          <span class="status-value">{{ sentSpeaker }}</span>
        </div>
        <div v-if="sentReferenceAudioProps" class="status-meta">
          <span class="status-label">参考音频</span>
          <span class="status-value">
            <AudioLabel
              v-bind="sentReferenceAudioProps"
              extra-text="点击播放"
            />
          </span>
        </div>
        <div v-if="sentReferenceText" class="status-meta status-text">
          <span class="status-label">参考文本</span>
          <span class="status-value">{{ sentReferenceText }}</span>
        </div>
        <div v-if="taskStatus?.error" class="status-meta status-error">
          <span class="status-label">Error</span>
          <span class="status-value">{{ taskStatus.error }}</span>
        </div>
        <template v-if="isCompleted">
          <div v-if="compressedUrl" class="audio-block">
            <div class="status-label">在线试听</div>
            <audio :src="compressedUrl" controls />
          </div>
          <n-space v-if="downloadLinks.length" size="small">
            <n-button
              v-for="item in downloadLinks"
              :key="item.label"
              tag="a"
              :href="item.url"
              :download="item.filename"
              size="small"
            >
              {{ item.label }}
            </n-button>
          </n-space>
        </template>
      </n-space>
    </n-card>

    <n-card
      v-if="historyItems.length"
      title="历史任务"
      size="small"
      class="tts-card"
    >
      <n-space vertical size="small">
        <n-space justify="space-between" align="center">
          <div class="status-label">最近 {{ historyItems.length }} 条</div>
          <n-button size="tiny" tertiary @click="clearHistory">
            清空历史
          </n-button>
        </n-space>
        <div
          v-for="item in historyItems"
          :key="item.taskId"
          class="history-item"
        >
          <div class="history-header">
            <n-tag :type="getStatusMeta(item.status?.status).type" size="small">
              <template #icon>
                <n-icon>
                  <component :is="getStatusMeta(item.status?.status).icon" />
                </n-icon>
              </template>
              {{ getStatusMeta(item.status?.status).label }}
            </n-tag>
            <div class="status-meta">
              <span class="status-label">发送时间</span>
              <span class="status-value">{{ formatSentAt(item.sentAt) }}</span>
            </div>
            <div
              v-if="isWaitingStatus(item.status?.status)"
              class="status-meta"
            >
              <span class="status-label">排队</span>
              <span class="status-value">{{ item.status?.pending ?? 0 }}</span>
            </div>
            <n-button
              size="tiny"
              tertiary
              @click="removeHistoryItem(item.taskId)"
            >
              删除
            </n-button>
            <n-button
              v-if="item.status?.status === 'running'"
              size="tiny"
              tertiary
              @click="refreshHistoryStatus(item.taskId)"
            >
              刷新状态
            </n-button>
          </div>
          <div v-if="item.ttsText.trim()" class="status-meta status-text">
            <span class="status-label">TTS 文本</span>
            <span class="status-value">{{ item.ttsText }}</span>
          </div>
          <div v-if="item.speaker" class="status-meta">
            <span class="status-label">Speaker</span>
            <span class="status-value">{{ item.speaker }}</span>
          </div>
          <div v-if="historyAudioPropsMap[item.taskId]" class="status-meta">
            <span class="status-label">参考音频</span>
            <span class="status-value">
              <AudioLabel
                v-bind="historyAudioPropsMap[item.taskId]"
                extra-text="点击播放"
              />
            </span>
          </div>
          <div v-if="item.referenceText" class="status-meta status-text">
            <span class="status-label">参考文本</span>
            <span class="status-value">{{ item.referenceText }}</span>
          </div>
          <div v-if="item.status?.error" class="status-meta status-error">
            <span class="status-label">Error</span>
            <span class="status-value">{{ item.status.error }}</span>
          </div>
          <template v-if="item.status?.status === 'completed'">
            <div
              v-if="resolveTaskUrl(item.status?.save_path_compressed)"
              class="audio-block"
            >
              <div class="status-label">在线试听</div>
              <audio
                :src="resolveTaskUrl(item.status?.save_path_compressed)"
                controls
              />
            </div>
            <n-space v-if="getDownloadLinks(item.status).length" size="small">
              <n-button
                v-for="link in getDownloadLinks(item.status)"
                :key="link.label"
                tag="a"
                :href="link.url"
                :download="link.filename"
                size="small"
              >
                {{ link.label }}
              </n-button>
            </n-space>
          </template>
        </div>
      </n-space>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, type Component } from 'vue'
import { NAlert, NButton, NCard, NInput, NIcon, NSpace, NTag } from 'naive-ui'
import axios from 'axios'
import { store } from '../../store'
import AudioLabel from '../translate/AudioLabel.vue'
import { CheckmarkFilled, CloseFilled, Play, Time } from '@vicons/carbon'

type TaskStatus = {
  status: string
  pending: number
  save_path?: string | null
  save_path_compressed?: string | null
  error?: string | null
}

type HistoryItem = {
  taskId: string
  sentAt: string
  ttsText: string
  speaker: string
  referenceText: string
  referenceAudioId: string
  status?: TaskStatus | null
}

type StatusMetaType =
  | 'warning'
  | 'info'
  | 'success'
  | 'error'
  | 'default'
  | 'primary'

type StatusMeta = {
  label: string
  type: StatusMetaType
  icon: Component
}

const GENIE_SERVER = import.meta.env.VITE_GENIE_SERVER as string | undefined
const genieBase = GENIE_SERVER?.replace(/\/$/, '')

const ttsText = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const taskId = ref('')
const taskStatus = ref<TaskStatus | null>(null)
const sentAt = ref<Date | null>(null)
const sentTtsText = ref('')
const sentSpeaker = ref('')
const sentReferenceText = ref('')
const sentReferenceAudioId = ref('')
const historyItems = ref<HistoryItem[]>([])

const historyAudioPropsMap = computed(() =>
  historyItems.value.reduce<Record<string, { id: string; base: string }>>(
    (acc, item) => {
      const props = getAudioProps(item.referenceAudioId)
      if (props) {
        acc[item.taskId] = props
      }
      return acc
    },
    {}
  )
)

const pollIntervalMs = 5000
let pollTimer: number | null = null

const reference = computed(() => store.ttsReference)
const hasReference = computed(() => !!reference.value)
const referenceSpeaker = computed({
  get: () => reference.value?.speaker || '',
  set: () => undefined,
})
const referenceText = computed({
  get: () => reference.value?.text || '',
  set: () => undefined,
})

function getAudioProps(audioId?: string): { id: string; base: string } | null {
  if (!audioId) return null
  const parts = audioId.split('/')
  if (parts.length < 3) return null
  return {
    id: parts[2],
    base: `${parts[0]}/${parts[1]}`,
  }
}

const referenceAudioProps = computed(() =>
  getAudioProps(reference.value?.audioId)
)

const sentReferenceAudioProps = computed(() =>
  getAudioProps(sentReferenceAudioId.value)
)

const canSubmit = computed(() => {
  return (
    !!genieBase &&
    !!reference.value &&
    ttsText.value.trim().length > 0 &&
    !submitting.value
  )
})

const isCompleted = computed(() => taskStatus.value?.status === 'completed')
const showPending = computed(() =>
  isWaitingStatus(taskStatus.value?.status || '')
)
const sentAtLabel = computed(() => formatSentAt(sentAt.value))
const currentStatusMeta = computed(() =>
  getStatusMeta(taskStatus.value?.status)
)

function resolveTaskUrl(path?: string | null) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (!genieBase) return path
  const needsSlash = !path.startsWith('/')
  return `${genieBase}${needsSlash ? '/' : ''}${path}`
}

const compressedUrl = computed(() =>
  resolveTaskUrl(taskStatus.value?.save_path_compressed)
)

function getDownloadLinks(status?: TaskStatus | null) {
  if (!status) return []
  const links: Array<{ label: string; url: string; filename: string }> = []
  const raw = status.save_path
  const compressed = status.save_path_compressed

  const rawUrl = resolveTaskUrl(raw)
  if (rawUrl) {
    links.push({
      label: '下载原始文件',
      url: rawUrl,
      filename: raw ? raw.split('/').pop() || 'tts.wav' : 'tts.wav',
    })
  }

  const compressedUrlValue = resolveTaskUrl(compressed)
  if (compressedUrlValue) {
    links.push({
      label: '下载压缩文件',
      url: compressedUrlValue,
      filename: compressed
        ? compressed.split('/').pop() || 'tts.mp3'
        : 'tts.mp3',
    })
  }

  return links
}

const downloadLinks = computed(() => getDownloadLinks(taskStatus.value))

function toErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.message || fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

const HISTORY_KEY = 'tts-history'
const HISTORY_LIMIT = 50

function loadHistory() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryItem[]
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, HISTORY_LIMIT)
  } catch {
    return []
  }
}

function persistHistory(items: HistoryItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

function addHistoryItem(item: HistoryItem) {
  const next = [item, ...historyItems.value].slice(0, HISTORY_LIMIT)
  historyItems.value = next
  persistHistory(next)
}

function updateHistoryItem(taskIdValue: string, status: TaskStatus) {
  const next = historyItems.value.map((item) =>
    item.taskId === taskIdValue ? { ...item, status } : item
  )
  historyItems.value = next
  persistHistory(next)
}

async function refreshHistoryStatus(taskIdValue: string) {
  if (!genieBase) return
  try {
    const response = await axios.get(`${genieBase}/tasks/${taskIdValue}`)
    updateHistoryItem(taskIdValue, response.data as TaskStatus)
  } catch {
    // ignore refresh errors for history items
  }
}

function removeHistoryItem(taskIdValue: string) {
  const next = historyItems.value.filter((item) => item.taskId !== taskIdValue)
  historyItems.value = next
  persistHistory(next)
}

function clearHistory() {
  historyItems.value = []
  persistHistory([])
}

function formatSentAt(value?: Date | string | null) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN')
}

function isWaitingStatus(status?: string) {
  return ['pending', 'running'].includes(status || '')
}

function getStatusMeta(status?: string): StatusMeta {
  if (status === 'pending') {
    return { label: '等待中', type: 'warning', icon: Time }
  }
  if (status === 'running') {
    return { label: '处理中', type: 'info', icon: Play }
  }
  if (status === 'completed') {
    return { label: '已完成', type: 'success', icon: CheckmarkFilled }
  }
  if (status === 'failed' || status === 'error') {
    return { label: '失败', type: 'error', icon: CloseFilled }
  }
  return { label: '未知', type: 'default', icon: Time }
}

function startPolling() {
  stopPolling()
  fetchTaskStatus()
  pollTimer = window.setInterval(fetchTaskStatus, pollIntervalMs)
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

async function createTask() {
  if (!reference.value || !genieBase) return
  submitting.value = true
  errorMessage.value = ''
  try {
    const response = await axios.post(`${genieBase}/tasks`, {
      character_name: reference.value.speaker,
      reference_audio_id: reference.value.audioId,
      reference_audio_text: reference.value.text,
      text: ttsText.value,
    })
    taskId.value = response.data.task_id
    taskStatus.value = null
    sentTtsText.value = ttsText.value
    sentSpeaker.value = reference.value.speaker
    sentReferenceText.value = reference.value.text
    sentReferenceAudioId.value = reference.value.audioId
    sentAt.value = new Date()
    addHistoryItem({
      taskId: taskId.value,
      sentAt: sentAt.value.toISOString(),
      ttsText: sentTtsText.value,
      speaker: sentSpeaker.value,
      referenceText: sentReferenceText.value,
      referenceAudioId: sentReferenceAudioId.value,
      status: { status: 'pending', pending: 0 },
    })
    startPolling()
  } catch (error: unknown) {
    errorMessage.value = toErrorMessage(error, '请求失败')
    stopPolling()
  } finally {
    submitting.value = false
  }
}

async function fetchTaskStatus() {
  if (!taskId.value || !genieBase) return
  try {
    const response = await axios.get(`${genieBase}/tasks/${taskId.value}`)
    taskStatus.value = response.data as TaskStatus
    updateHistoryItem(taskId.value, taskStatus.value)
    if (!['pending', 'running'].includes(taskStatus.value.status)) {
      stopPolling()
    }
  } catch (error: unknown) {
    errorMessage.value = toErrorMessage(error, '查询失败')
    stopPolling()
  }
}

onBeforeUnmount(() => {
  stopPolling()
})

historyItems.value = loadHistory()
</script>

<style scoped>
.tts-panel {
  padding: 12px;
}

.tts-card :deep(.n-card__content) {
  padding: 12px;
}

.tts-card-compact :deep(.n-card__content) {
  padding: 10px;
}

.status-label {
  color: rgba(0, 0, 0, 0.55);
}

.status-value {
  word-break: break-all;
}

.reference-audio-inline {
  font-size: 12px;
  white-space: nowrap;
}

.reference-speaker {
  max-width: 160px;
}

.status-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
}

.status-error {
  color: #d03050;
}

.status-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.status-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
}

.status-text {
  align-items: flex-start;
}

.status-text .status-value {
  white-space: pre-wrap;
}

.history-item {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.audio-block audio {
  width: 100%;
  max-width: 360px;
}
</style>

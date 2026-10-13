<template>
  <div class="tts-panel">
    <header class="tts-hero">
      <div>
        <div class="tts-kicker">GENIE TTS</div>
        <h1>语音生成</h1>
        <p>选择一段角色语音作为参考，再输入希望生成的台词。</p>
      </div>
      <div class="tts-flow" aria-label="生成步骤">
        <span>参考音频</span>
        <i aria-hidden="true"></i>
        <span>输入文本</span>
        <i aria-hidden="true"></i>
        <span>生成结果</span>
      </div>
    </header>

    <n-alert
      v-if="!genieBase"
      type="warning"
      title="服务未配置"
      :show-icon="false"
      class="service-alert"
    >
      请设置环境变量 `VITE_GENIE_SERVER` 指向 Genie TTS 服务地址。
    </n-alert>

    <div class="tts-setup-grid">
      <n-card title="参考音频" size="small" class="tts-card tts-card-reference">
        <n-space vertical size="small">
          <n-space
            justify="space-between"
            align="center"
            size="small"
            wrap
            class="reference-row"
          >
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
                display-download
              />
              <div v-else class="status-value">未选择</div>
            </div>
          </n-space>
          <n-input
            v-model:value="referenceTextInput"
            type="textarea"
            placeholder="Reference Text"
            :autosize="{ minRows: 2, maxRows: 4 }"
            size="small"
          />
          <n-alert v-if="!hasReference" type="warning" :show-icon="false">
            尚未选择参考音频，请从搜索页选择后进入。
          </n-alert>
        </n-space>
      </n-card>

      <n-card title="TTS 生成" size="small" class="tts-card tts-card-generator">
        <n-space vertical size="small">
          <n-input
            v-model:value="ttsText"
            type="textarea"
            placeholder="请输入要生成的文本"
            :autosize="{ minRows: 3, maxRows: 6 }"
            size="small"
          />
          <n-space justify="space-between" align="center" class="action-row">
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
    </div>

    <n-card
      v-if="taskId"
      title="任务状态"
      size="small"
      class="tts-card tts-card-status"
    >
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
          <div v-if="sentSpeaker" class="model-chip" aria-label="使用模型">
            <span>模型</span>
            <strong>{{ sentSpeaker }}</strong>
          </div>
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
        <div v-if="taskStatus?.error" class="status-meta status-error">
          <span class="status-label">Error</span>
          <span class="status-value">{{ taskStatus.error }}</span>
        </div>
        <div
          v-if="isCompleted && (compressedUrl || downloadLinks.length)"
          class="audio-result"
        >
          <div v-if="compressedUrl" class="audio-preview">
            <div class="status-label">在线试听</div>
            <audio :src="compressedUrl" controls />
          </div>
          <div v-if="downloadLinks.length" class="download-shelf">
            <div class="download-shelf-title">下载音频</div>
            <div class="download-options">
              <button
                v-for="item in downloadLinks"
                :key="item.format"
                type="button"
                class="download-option"
                :class="{ 'download-option--expired': item.expired }"
                :aria-label="`下载 ${item.format}，${item.expiry}`"
                @click="downloadTtsFile(item)"
              >
                <span class="download-format">{{ item.format }}</span>
                <span class="download-expiry">{{ item.expiry }}</span>
                <n-icon class="download-option-icon" aria-hidden="true">
                  <Download />
                </n-icon>
              </button>
            </div>
          </div>
        </div>
        <details
          v-if="sentReferenceAudioProps || sentReferenceText"
          class="task-details"
        >
          <summary>生成详情</summary>
          <div class="task-details-body">
            <div v-if="sentReferenceAudioProps" class="status-meta">
              <span class="status-label">参考音频</span>
              <span class="status-value">
                <AudioLabel
                  v-bind="sentReferenceAudioProps"
                  extra-text="点击播放"
                  display-download
                />
              </span>
            </div>
            <div v-if="sentReferenceText" class="status-meta status-text">
              <span class="status-label">参考文本</span>
              <span class="status-value">{{ sentReferenceText }}</span>
            </div>
          </div>
        </details>
      </n-space>
    </n-card>

    <n-card
      v-if="historyItems.length"
      title="历史任务"
      size="small"
      class="tts-card"
    >
      <n-space vertical size="small">
        <n-space justify="space-between" align="center" class="history-toolbar">
          <div class="status-label">最近 {{ historyItems.length }} 条</div>
          <n-button size="small" type="error" tertiary @click="clearHistory">
            清空历史
          </n-button>
        </n-space>
        <div
          v-for="item in historyItems"
          :key="item.taskId"
          class="history-item"
        >
          <div class="history-header">
            <div class="history-summary">
              <n-tag
                :type="getStatusMeta(item.status?.status).type"
                size="small"
              >
                <template #icon>
                  <n-icon>
                    <component :is="getStatusMeta(item.status?.status).icon" />
                  </n-icon>
                </template>
                {{ getStatusMeta(item.status?.status).label }}
              </n-tag>
              <span
                v-if="item.speaker"
                class="model-chip"
                aria-label="使用模型"
              >
                <span>模型</span>
                <strong>{{ item.speaker }}</strong>
              </span>
              <div class="history-time" aria-label="发送时间">
                <n-icon><Time /></n-icon>
                <span>{{ formatSentAt(item.sentAt) }}</span>
              </div>
              <span
                v-if="isWaitingStatus(item.status?.status)"
                class="history-queue"
              >
                排队 {{ item.status?.pending ?? 0 }}
              </span>
            </div>
            <div class="history-actions">
              <n-button
                v-if="item.status?.status === 'running'"
                size="small"
                tertiary
                @click="refreshHistoryStatus(item.taskId)"
              >
                刷新状态
              </n-button>
              <n-button
                size="small"
                type="error"
                tertiary
                @click="removeHistoryItem(item.taskId)"
              >
                删除
              </n-button>
            </div>
          </div>
          <div class="history-body">
            <div
              v-if="item.ttsText.trim()"
              class="status-meta status-text history-primary-text"
            >
              <span class="status-label">TTS 文本</span>
              <span class="status-value">{{ item.ttsText }}</span>
            </div>
            <div v-if="item.status?.error" class="status-meta status-error">
              <span class="status-label">Error</span>
              <span class="status-value">{{ item.status.error }}</span>
            </div>
            <div
              v-if="
                item.status?.status === 'completed' &&
                (resolveTaskUrl(item.status?.save_path_compressed) ||
                  getDownloadLinks(item.status).length)
              "
              class="audio-result"
            >
              <div
                v-if="resolveTaskUrl(item.status?.save_path_compressed)"
                class="audio-preview"
              >
                <div class="status-label">在线试听</div>
                <audio
                  :src="resolveTaskUrl(item.status?.save_path_compressed)"
                  controls
                />
              </div>
              <div
                v-if="getDownloadLinks(item.status).length"
                class="download-shelf"
              >
                <div class="download-shelf-title">下载音频</div>
                <div class="download-options">
                  <button
                    v-for="link in getDownloadLinks(item.status)"
                    :key="link.format"
                    type="button"
                    class="download-option"
                    :class="{ 'download-option--expired': link.expired }"
                    :aria-label="`下载 ${link.format}，${link.expiry}`"
                    @click="downloadTtsFile(link)"
                  >
                    <span class="download-format">{{ link.format }}</span>
                    <span class="download-expiry">{{ link.expiry }}</span>
                    <n-icon class="download-option-icon" aria-hidden="true">
                      <Download />
                    </n-icon>
                  </button>
                </div>
              </div>
            </div>
            <details
              v-if="historyAudioPropsMap[item.taskId] || item.referenceText"
              class="task-details"
            >
              <summary>生成详情</summary>
              <div class="task-details-body">
                <div
                  v-if="historyAudioPropsMap[item.taskId]"
                  class="status-meta"
                >
                  <span class="status-label">参考音频</span>
                  <span class="status-value">
                    <AudioLabel
                      v-bind="historyAudioPropsMap[item.taskId]"
                      extra-text="点击播放"
                      display-download
                    />
                  </span>
                </div>
                <div v-if="item.referenceText" class="status-meta status-text">
                  <span class="status-label">参考文本</span>
                  <span class="status-value">{{ item.referenceText }}</span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch, type Component } from 'vue'
import { NAlert, NButton, NCard, NInput, NIcon, NSpace, NTag } from 'naive-ui'
import axios from 'axios'
import { store } from '../../store'
import AudioLabel from '../translate/AudioLabel.vue'
import {
  CheckmarkFilled,
  CloseFilled,
  Download,
  Play,
  Time,
} from '@vicons/carbon'

type TaskStatus = {
  status: string
  pending: number
  save_path?: string | null
  save_path_compressed?: string | null
  wav_expires_at?: string | null
  ogg_expires_at?: string | null
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

type DownloadLink = {
  format: 'WAV' | 'OGG'
  expiry: string
  expired: boolean
  url: string
  filename: string
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
const referenceTextInput = ref('')

watch(
  reference,
  (value) => {
    referenceTextInput.value = value?.text || ''
  },
  { immediate: true }
)

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

const DAY_MS = 24 * 60 * 60 * 1000

function getExpiry(expiresAt?: string | null) {
  const timestamp = expiresAt ? Date.parse(expiresAt) : Number.NaN
  const remainingMs = timestamp - Date.now()
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return { expiry: '已过期 · 可尝试', expired: true }
  }
  return {
    expiry: `剩余 ${Math.ceil(remainingMs / DAY_MS)} 天`,
    expired: false,
  }
}

function getDownloadLinks(status?: TaskStatus | null) {
  if (!status) return []
  const links: DownloadLink[] = []
  const raw = status.save_path
  const compressed = status.save_path_compressed

  const rawUrl = resolveTaskUrl(raw)
  if (rawUrl) {
    links.push({
      format: 'WAV',
      ...getExpiry(status.wav_expires_at),
      url: rawUrl,
      filename: raw ? raw.split('/').pop() || 'tts.wav' : 'tts.wav',
    })
  }

  const compressedUrlValue = resolveTaskUrl(compressed)
  if (compressedUrlValue) {
    links.push({
      format: 'OGG',
      ...getExpiry(status.ogg_expires_at),
      url: compressedUrlValue,
      filename: compressed
        ? compressed.split('/').pop() || 'tts.mp3'
        : 'tts.mp3',
    })
  }

  return links
}

const downloadLinks = computed(() => getDownloadLinks(taskStatus.value))

async function triggerDownload(url: string, filename: string) {
  if (typeof window === 'undefined') return
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('download failed')
    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(objectUrl)
  } catch (error) {
    window.open(url, '_blank')
  }
}

function downloadTtsFile(link: DownloadLink) {
  if (!link.url) return
  triggerDownload(link.url, link.filename)
}

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
      reference_audio_text: referenceTextInput.value,
      text: ttsText.value,
    })
    taskId.value = response.data.task_id
    taskStatus.value = null
    sentTtsText.value = ttsText.value
    sentSpeaker.value = reference.value.speaker
    sentReferenceText.value = referenceTextInput.value
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
  --tts-accent: #18a058;
  --tts-text: #26313d;
  --tts-muted: #66717e;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 840px;
  margin: 0 auto;
  padding: 18px 12px 32px;
  text-align: left;
}

.tts-hero {
  display: flex;
  gap: 24px;
  align-items: flex-end;
  justify-content: space-between;
  padding: 22px 24px;
  overflow: hidden;
  border: 1px solid rgba(24, 160, 88, 0.16);
  border-radius: 16px;
  background: radial-gradient(
      circle at 95% 0,
      rgba(24, 160, 88, 0.16),
      transparent 34%
    ),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), #eff9f4);
  box-shadow: 0 12px 32px rgba(31, 41, 55, 0.07);
}

.tts-kicker {
  color: var(--tts-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.tts-hero h1 {
  margin: 3px 0 4px;
  color: #1d2b25;
  font-size: 27px;
  line-height: 1.25;
}

.tts-hero p {
  margin: 0;
  color: var(--tts-muted);
  font-size: 13px;
}

.tts-flow {
  display: flex;
  flex: 0 0 auto;
  gap: 7px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid rgba(24, 160, 88, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #456056;
  font-size: 11px;
  white-space: nowrap;
}

.tts-flow i {
  width: 18px;
  height: 1px;
  background: rgba(24, 160, 88, 0.38);
}

.tts-setup-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
  gap: 12px;
}

.service-alert {
  border-radius: 10px;
}

.tts-card {
  overflow: hidden;
  border: 1px solid rgba(31, 41, 55, 0.09);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.06);
}

.tts-card :deep(.n-card-header) {
  padding: 15px 18px 10px;
}

.tts-card :deep(.n-card-header__main) {
  color: var(--tts-text);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tts-card :deep(.n-card__content) {
  padding: 12px 18px 16px;
}

.tts-card-reference {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), #f7faf9);
}

.tts-card-generator {
  border-color: rgba(24, 160, 88, 0.22);
  box-shadow: 0 10px 28px rgba(24, 160, 88, 0.09);
}

.tts-card-generator :deep(.n-card-header) {
  background: linear-gradient(90deg, rgba(24, 160, 88, 0.08), transparent);
}

.tts-card-reference :deep(.n-card-header__main)::before,
.tts-card-generator :deep(.n-card-header__main)::before {
  display: inline-grid;
  width: 22px;
  height: 22px;
  place-items: center;
  margin-right: 8px;
  border-radius: 7px;
  background: rgba(24, 160, 88, 0.1);
  color: var(--tts-accent);
  font-size: 11px;
  font-weight: 700;
}

.tts-card-reference :deep(.n-card-header__main)::before {
  content: '1';
}

.tts-card-generator :deep(.n-card-header__main)::before {
  content: '2';
}

.tts-panel :deep(.n-button) {
  margin: 0;
  border-radius: 8px;
}

.tts-panel :deep(.n-input) {
  border-radius: 8px;
}

.status-label {
  color: var(--tts-muted);
  font-weight: 600;
  white-space: nowrap;
}

.status-value {
  min-width: 0;
  color: var(--tts-text);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.reference-row {
  min-height: 34px;
}

.reference-audio-inline {
  box-sizing: border-box;
  display: flex;
  min-height: 30px;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(24, 160, 88, 0.07);
  font-size: 12px;
  white-space: nowrap;
}

.reference-speaker {
  max-width: 180px;
}

.action-row {
  margin-top: 4px;
}

.tts-card-generator .action-row :deep(.n-button--primary-type) {
  min-width: 116px;
}

.status-error {
  color: #d03050;
}

.status-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(31, 41, 55, 0.08);
}

.status-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
}

.model-chip {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(31, 41, 55, 0.055);
  color: var(--tts-muted);
  font-size: 11px;
  line-height: 1.4;
  white-space: nowrap;
}

.model-chip strong {
  color: #34423c;
  font-size: 12px;
  font-weight: 650;
}

.status-text {
  align-items: flex-start;
}

.status-text .status-value {
  white-space: pre-wrap;
}

.tts-card-status
  > :deep(.n-card__content)
  > .n-space
  > .n-space-item
  > .status-meta,
.history-body > .status-meta,
.task-details-body > .status-meta {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(31, 41, 55, 0.05);
}

.history-toolbar {
  padding: 0 2px 6px;
}

.history-item {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid rgba(31, 41, 55, 0.09);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 5px 16px rgba(31, 41, 55, 0.045);
}

.history-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(31, 41, 55, 0.08);
  background: linear-gradient(90deg, #f6faf8, #fbfcfc);
}

.history-summary,
.history-actions,
.history-time {
  display: flex;
  align-items: center;
}

.history-summary {
  flex-wrap: wrap;
  gap: 8px 12px;
  min-width: 0;
}

.history-time {
  gap: 5px;
  color: var(--tts-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.history-queue {
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(24, 160, 88, 0.08);
  color: #456056;
  font-size: 11px;
}

.history-actions {
  gap: 4px;
  margin-left: auto;
}

.history-actions :deep(.n-button),
.history-toolbar :deep(.n-button) {
  min-height: 30px;
}

.history-body {
  padding: 0 14px 14px;
}

.history-primary-text .status-value {
  color: #1f2d27;
  font-weight: 600;
}

.audio-result {
  overflow: hidden;
  margin-top: 10px;
  border: 1px solid rgba(31, 41, 55, 0.08);
  border-radius: 12px;
  background: #f7f8f8;
}

.audio-preview {
  padding: 11px 12px 12px;
}

.audio-preview audio {
  display: block;
  width: 100%;
  height: 36px;
  margin-top: 6px;
}

.download-shelf {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 9px 10px 9px 12px;
  border-top: 1px solid rgba(31, 41, 55, 0.07);
  background: rgba(255, 255, 255, 0.72);
}

.download-shelf-title {
  flex: 0 0 auto;
  color: var(--tts-muted);
  font-size: 12px;
  font-weight: 600;
}

.download-options {
  display: flex;
  gap: 7px;
  min-width: 0;
}

.download-option {
  display: grid;
  grid-template-columns: auto auto 16px;
  gap: 8px;
  align-items: center;
  min-height: 38px;
  padding: 0 11px;
  border: 1px solid rgba(31, 41, 55, 0.1);
  border-radius: 9px;
  background: #fff;
  color: var(--tts-text);
  font: inherit;
  cursor: pointer;
  transition: border-color 120ms ease, background-color 120ms ease;
}

.download-option:hover {
  border-color: rgba(24, 160, 88, 0.34);
  background: #fbfdfc;
}

.download-option--expired {
  border-style: dashed;
  background: rgba(255, 255, 255, 0.42);
  color: #66716c;
}

.download-option--expired .download-option-icon {
  opacity: 0.64;
}

.download-option:focus-visible {
  outline: 2px solid rgba(24, 160, 88, 0.48);
  outline-offset: 2px;
}

.download-format {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.download-expiry {
  color: var(--tts-muted);
  font-size: 11px;
  white-space: nowrap;
}

.download-option-icon {
  color: #55635d;
  font-size: 16px;
}

.task-details {
  margin-top: 2px;
}

.task-details summary {
  display: list-item;
  width: max-content;
  min-height: 30px;
  padding-top: 8px;
  color: var(--tts-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.task-details[open] summary {
  color: var(--tts-text);
}

.task-details-body {
  padding-top: 2px;
}

@media (max-width: 600px) {
  .tts-panel {
    padding: 10px 0 24px;
  }

  .tts-hero {
    gap: 14px;
    align-items: flex-start;
    padding: 18px;
  }

  .tts-hero h1 {
    font-size: 24px;
  }

  .tts-flow {
    display: none;
  }

  .tts-setup-grid {
    grid-template-columns: 1fr;
  }

  .tts-card {
    border-radius: 10px;
  }

  .tts-card :deep(.n-card-header) {
    padding: 14px 14px 8px;
  }

  .tts-card :deep(.n-card__content) {
    padding: 10px 14px 14px;
  }

  .reference-speaker {
    width: 100%;
    max-width: none;
  }

  .reference-audio-inline {
    width: 100%;
    justify-content: flex-start;
  }

  .action-row {
    width: 100%;
  }

  .action-row :deep(.n-button) {
    flex: 1;
  }

  .tts-card-status
    > :deep(.n-card__content)
    > .n-space
    > .n-space-item
    > .status-meta,
  .history-body > .status-meta,
  .task-details-body > .status-meta {
    grid-template-columns: 68px minmax(0, 1fr);
    gap: 8px;
  }

  .history-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) max-content;
    gap: 8px;
    align-items: flex-start;
    padding: 10px;
  }

  .history-summary {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 6px 8px;
  }

  .history-summary > :deep(.n-tag) {
    grid-column: 1;
  }

  .history-summary > .model-chip {
    grid-column: 2;
    justify-self: start;
  }

  .history-time,
  .history-queue {
    grid-column: 1 / -1;
  }

  .history-actions {
    grid-column: 2;
    grid-row: 1;
    flex-direction: column;
    margin-left: 0;
  }

  .history-actions :deep(.n-button),
  .history-toolbar :deep(.n-button) {
    min-height: 44px;
  }

  .history-body {
    padding: 0 12px 12px;
  }

  .download-shelf {
    align-items: stretch;
    flex-direction: column;
    gap: 7px;
    padding: 9px;
  }

  .download-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .download-option {
    grid-template-areas:
      'format icon'
      'expiry icon';
    grid-template-columns: minmax(0, 1fr) 16px;
    gap: 1px 8px;
    min-height: 50px;
    justify-items: start;
  }

  .download-format {
    grid-area: format;
  }

  .download-expiry {
    grid-area: expiry;
  }

  .download-option-icon {
    grid-area: icon;
    align-self: center;
  }
}
</style>

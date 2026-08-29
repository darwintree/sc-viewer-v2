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
              display-download
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
          <n-space
            v-if="downloadLinks.length"
            size="small"
            class="download-actions"
          >
            <n-button
              v-for="item in downloadLinks"
              :key="item.label"
              size="small"
              @click="downloadTtsFile(item)"
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
        <n-space justify="space-between" align="center" class="history-toolbar">
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
                display-download
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
            <n-space
              v-if="getDownloadLinks(item.status).length"
              size="small"
              class="download-actions"
            >
              <n-button
                v-for="link in getDownloadLinks(item.status)"
                :key="link.label"
                size="small"
                @click="downloadTtsFile(link)"
              >
                {{ link.label }}
              </n-button>
            </n-space>
          </template>
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
import { CheckmarkFilled, CloseFilled, Play, Time } from '@vicons/carbon'

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
  label: string
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

function formatRemainingDays(expiresAt?: string | null) {
  const timestamp = expiresAt ? Date.parse(expiresAt) : Number.NaN
  const remainingMs = timestamp - Date.now()
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return '已过期'
  return `剩余 ${Math.ceil(remainingMs / DAY_MS)} 天`
}

function getDownloadLinks(status?: TaskStatus | null) {
  if (!status) return []
  const links: DownloadLink[] = []
  const raw = status.save_path
  const compressed = status.save_path_compressed

  const rawUrl = resolveTaskUrl(raw)
  if (rawUrl) {
    links.push({
      label: `下载 WAV · ${formatRemainingDays(status.wav_expires_at)}`,
      url: rawUrl,
      filename: raw ? raw.split('/').pop() || 'tts.wav' : 'tts.wav',
    })
  }

  const compressedUrlValue = resolveTaskUrl(compressed)
  if (compressedUrlValue) {
    links.push({
      label: `下载 OGG · ${formatRemainingDays(status.ogg_expires_at)}`,
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

.action-row,
.download-actions {
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
.history-item > .status-meta {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(31, 41, 55, 0.05);
}

.history-toolbar {
  padding-bottom: 4px;
}

.history-item {
  border: 1px solid rgba(31, 41, 55, 0.09);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  background: #fbfcfc;
}

.history-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
  padding-bottom: 10px;
  margin-bottom: 2px;
  border-bottom: 1px solid rgba(31, 41, 55, 0.08);
}

.history-header :deep(.n-button:first-of-type) {
  margin-left: auto;
}

.audio-block {
  padding: 10px 12px 12px;
  margin-top: 10px;
  border-radius: 10px;
  background: #f3f6f5;
}

.audio-block audio {
  display: block;
  width: 100%;
  height: 36px;
  margin-top: 6px;
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

  .action-row,
  .download-actions {
    width: 100%;
  }

  .action-row :deep(.n-button),
  .download-actions :deep(.n-button) {
    flex: 1;
  }

  .tts-card-status
    > :deep(.n-card__content)
    > .n-space
    > .n-space-item
    > .status-meta,
  .history-item > .status-meta {
    grid-template-columns: 68px minmax(0, 1fr);
    gap: 8px;
  }
}
</style>

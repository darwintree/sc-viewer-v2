<template>
  <div ref="panelRef" class="tts-panel">
    <header class="tts-hero">
      <div>
        <div class="tts-kicker">IRODORI TTS</div>
        <h1>语音生成</h1>
        <p>直接选择角色内置音色或搭配参考音频，再输入日文语气描述与台词。</p>
      </div>
      <div class="tts-flow" aria-label="生成步骤">
        <span>音色选择</span>
        <i aria-hidden="true"></i>
        <span>语气描述</span>
        <i aria-hidden="true"></i>
        <span>生成结果</span>
      </div>
    </header>

    <n-alert
      v-if="!ttsBase"
      type="warning"
      title="服务未配置"
      :show-icon="false"
      class="service-alert"
    >
      请设置环境变量 `VITE_TTS_SERVER`（或 `VITE_GENIE_SERVER`）指向 TTS
      服务地址。
    </n-alert>

    <div class="tts-setup-grid">
      <n-card title="音色与参考" size="small" class="tts-card tts-card-voice">
        <n-space vertical size="small">
          <div class="speaker-select-row">
            <n-select
              :value="selectedSpeaker"
              :options="speakerOptions"
              :render-label="renderSpeakerOption"
              placeholder="请选择角色（29 位可选，支持搜索）"
              filterable
              size="small"
              class="speaker-select"
              @update:value="handleSpeakerChange"
            />
            <n-tag
              v-if="selectedSpeaker"
              :type="hasReferenceAudio ? 'success' : 'info'"
              size="small"
              round
              class="voice-mode-tag"
            >
              {{ hasReferenceAudio ? '参考音频' : '内置音色' }}
            </n-tag>
          </div>

          <div v-if="referenceAudioProps" class="reference-box">
            <div class="reference-box-header">
              <div class="reference-audio-inline">
                <AudioLabel
                  v-bind="referenceAudioProps"
                  extra-text="点击播放"
                  display-download
                />
              </div>
              <n-button
                size="tiny"
                quaternary
                type="warning"
                @click="clearReference"
              >
                清除参考
              </n-button>
            </div>
            <div v-if="referenceText.trim()" class="reference-transcript">
              <span class="reference-transcript-label">参考原台词</span>
              <span class="reference-transcript-text">{{ referenceText }}</span>
            </div>
          </div>

          <div v-else class="reference-hint-box">
            <p class="reference-hint-text">
              {{
                selectedSpeaker
                  ? '当前将使用角色内置音色生成；如需参考特定台词语气，可前往搜索页挑选。'
                  : '可直接选择角色使用内置音色，或从语音搜索页带入一段参考音频。'
              }}
            </p>
            <n-button size="tiny" secondary @click="goToVoiceSearch">
              去语音搜索选参考音频
            </n-button>
          </div>
        </n-space>
      </n-card>

      <n-card
        title="语气与风格描述（可选）"
        size="small"
        class="tts-card tts-card-caption"
      >
        <n-space vertical size="small">
          <div class="caption-input-header">
            <span class="field-hint">需使用日文描述，留空则由模型自然发挥</span>
            <n-button
              v-if="captionText.trim()"
              size="tiny"
              quaternary
              @click="captionText = ''"
            >
              清空
            </n-button>
          </div>
          <n-input
            v-model:value="captionText"
            type="textarea"
            placeholder="请输入日文语气/情绪描述，或点选下方内置预设"
            :autosize="{ minRows: 2, maxRows: 4 }"
            size="small"
          />
          <div v-if="showNonJapaneseCaptionHint" class="caption-lang-hint">
            当前内容未检测到日文假名，模型对日文描述控制效果更好，建议使用日文或点选下方预设。
          </div>

          <div class="preset-section">
            <div class="preset-section-title">
              内置预设（点击填入，可继续编辑）
            </div>
            <div class="caption-preset-list">
              <button
                v-for="preset in CAPTION_PRESETS"
                :key="preset.ja"
                type="button"
                class="caption-preset-item"
                :class="{
                  'caption-preset-item--active':
                    captionText.trim() === preset.ja,
                }"
                @click="applyCaptionPreset(preset.ja)"
              >
                <span class="caption-preset-zh">{{ preset.zh }}</span>
                <span class="caption-preset-ja">{{ preset.ja }}</span>
              </button>
            </div>
          </div>
        </n-space>
      </n-card>
    </div>

    <n-card title="生成台词" size="small" class="tts-card tts-card-generator">
      <n-space vertical size="small">
        <n-input
          v-model:value="ttsText"
          type="textarea"
          placeholder="请输入要生成的日文台词"
          :autosize="{ minRows: 3, maxRows: 6 }"
          size="small"
        />
        <div class="action-row">
          <div class="action-buttons">
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
          </div>
          <div v-if="selectedSpeaker" class="submit-summary">
            <span>{{ selectedSpeaker }}</span>
            <i>·</i>
            <span>{{ hasReferenceAudio ? '参考音频' : '内置音色' }}</span>
            <template v-if="captionText.trim()">
              <i>·</i>
              <span>含语气描述</span>
            </template>
          </div>
        </div>
        <n-alert v-if="errorMessage" type="error" :show-icon="false">
          {{ errorMessage }}
        </n-alert>
      </n-space>
    </n-card>

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
          <div v-if="sentSpeaker" class="model-chip" aria-label="使用角色">
            <span>角色</span>
            <strong>{{ sentSpeaker }}</strong>
          </div>
          <n-tag
            :type="sentVoiceMode === 'reference' ? 'success' : 'info'"
            size="small"
            round
          >
            {{ sentVoiceMode === 'reference' ? '参考音频' : '内置音色' }}
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
        <div v-if="sentCaption.trim()" class="status-meta status-text">
          <span class="status-label">语气描述</span>
          <span class="status-value">{{ sentCaption }}</span>
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
          <summary>参考详情</summary>
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
              <span class="status-label">参考台词</span>
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
                aria-label="使用角色"
              >
                <span>角色</span>
                <strong>{{ item.speaker }}</strong>
              </span>
              <n-tag
                :type="
                  getHistoryVoiceMode(item) === 'reference' ? 'success' : 'info'
                "
                size="small"
                round
              >
                {{
                  getHistoryVoiceMode(item) === 'reference'
                    ? '参考音频'
                    : '内置音色'
                }}
              </n-tag>
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
                size="small"
                tertiary
                type="primary"
                @click="reuseHistoryItem(item)"
              >
                复用参数
              </n-button>
              <n-button
                v-if="isWaitingStatus(item.status?.status)"
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
            <div
              v-if="item.caption && item.caption.trim()"
              class="status-meta status-text"
            >
              <span class="status-label">语气描述</span>
              <span class="status-value">{{ item.caption }}</span>
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
              <summary>参考详情</summary>
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
                  <span class="status-label">参考台词</span>
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
import { ref, computed, h, onBeforeUnmount, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NIcon,
  NInput,
  NSelect,
  NSpace,
  NTag,
  type SelectOption,
} from 'naive-ui'
import axios from 'axios'
import { store } from '../../store'
import { characters, getAvatarPath } from '../../helper/path'
import AudioLabel from '../translate/AudioLabel.vue'
import {
  CheckmarkFilled,
  CloseFilled,
  Download,
  Play,
  Time,
} from '@vicons/carbon'

type VoiceMode = 'embed' | 'reference'

type CaptionPreset = {
  zh: string
  ja: string
}

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
  caption?: string
  voiceMode?: VoiceMode
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

const CAPTION_PRESETS: readonly CaptionPreset[] = [
  {
    zh: '温柔平静地轻声交谈',
    ja: '落ち着いた柔らかな口調で、相手を気遣いながら静かに話している。',
  },
  {
    zh: '开心明快、元气满满地说话',
    ja: '明るく弾んだ口調で、心から嬉しそうに元気よく話している。',
  },
  {
    zh: '带着轻笑、亲切温暖地讲述',
    ja: '小さく柔らかな笑い声を漏らしながら、温かく親しげに語りかけている。',
  },
  {
    zh: '略带害羞、轻声细语地诉说',
    ja: '少し照れくさそうに息を漏らしながら、控えめな声で優しく話している。',
  },
  {
    zh: '极轻的气声耳语、悄悄叮嘱',
    ja: '息を多めに含ませた控えめな囁き声で、そっと語りかけている。',
  },
  {
    zh: '强忍泪水、声音微微颤抖',
    ja: '涙を堪えながら声を小さく震わせ、今にも消えそうな音量で話している。',
  },
  {
    zh: '压抑怒火、冷静强硬地开口',
    ja: '怒りを抑えた冷たく強い口調で、語尾を言い切るようにきっぱりと話している。',
  },
  {
    zh: '慌张焦急、语速加快地诉说',
    ja: '息を切らして慌てたように、早口で焦りを滲ませながら必死に話している。',
  },
  {
    zh: '略微傲娇、嘴硬又带点羞涩',
    ja: '少し照れ隠しながらもツンとした強気な口調で、早口に話している。',
  },
  {
    zh: '困倦迷糊、慢悠悠地说着',
    ja: '眠そうに、ぼんやりとゆっくりした口調で話している。',
  },
  {
    zh: '疲惫无力、平淡低落地开口',
    ja: '疲れ切ったように力を抜いた平坦なトーンで、淡々と話している。',
  },
  {
    zh: '面向舞台大声热情地呼喊',
    ja: '広い会場に向かって声を張り上げ、全力で明るく元気いっぱいに呼びかけている。',
  },
]

const TTS_SERVER = (import.meta.env.VITE_TTS_SERVER ||
  import.meta.env.VITE_GENIE_SERVER) as string | undefined
const ttsBase = TTS_SERVER?.replace(/\/$/, '')

const router = useRouter()
const panelRef = ref<HTMLElement | null>(null)

const speakerOptions: SelectOption[] = characters
  .filter((item) => Number(item.id) <= 28 || item.id === '32')
  .map((item) => ({
    value: item.firstName,
    label: item.firstName,
  }))

function renderSpeakerOption(option: SelectOption) {
  const name = String(option.label || option.value || '')
  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      },
    },
    [
      h('img', {
        src: getAvatarPath(name),
        alt: '',
        style: {
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: '0',
        },
      }),
      h('span', null, name),
    ]
  )
}

const selectedSpeaker = ref<string | null>(null)
const referenceAudioId = ref('')
const referenceText = ref('')
const captionText = ref('')
const ttsText = ref('')

const submitting = ref(false)
const errorMessage = ref('')
const taskId = ref('')
const taskStatus = ref<TaskStatus | null>(null)
const sentAt = ref<Date | null>(null)
const sentTtsText = ref('')
const sentSpeaker = ref('')
const sentCaption = ref('')
const sentVoiceMode = ref<VoiceMode>('embed')
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

const pollIntervalMs = 2000
let pollTimer: number | null = null

const reference = computed(() => store.ttsReference)

watch(
  reference,
  (value) => {
    if (value) {
      selectedSpeaker.value = value.speaker || null
      referenceAudioId.value = value.audioId || ''
      referenceText.value = value.text || ''
    } else {
      referenceAudioId.value = ''
      referenceText.value = ''
    }
  },
  { immediate: true }
)

function clearReference() {
  referenceAudioId.value = ''
  referenceText.value = ''
  store.ttsReference = null
}

function handleSpeakerChange(value: string | null) {
  const previous = selectedSpeaker.value
  selectedSpeaker.value = value
  if (referenceAudioId.value && value !== previous) {
    clearReference()
  }
}

function goToVoiceSearch() {
  router.push({ path: '/search' })
}

function applyCaptionPreset(jaCaption: string) {
  captionText.value = jaCaption
}

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
  getAudioProps(referenceAudioId.value)
)

const hasReferenceAudio = computed(() => !!referenceAudioId.value.trim())

const sentReferenceAudioProps = computed(() =>
  getAudioProps(sentReferenceAudioId.value)
)

const JAPANESE_KANA_RE = /[\u3040-\u309f\u30a0-\u30ff]/

const showNonJapaneseCaptionHint = computed(() => {
  const value = captionText.value.trim()
  return value.length > 0 && !JAPANESE_KANA_RE.test(value)
})

const canSubmit = computed(() => {
  return (
    !!ttsBase &&
    !!selectedSpeaker.value &&
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

function getHistoryVoiceMode(item: HistoryItem): VoiceMode {
  if (item.voiceMode) return item.voiceMode
  return item.referenceAudioId ? 'reference' : 'embed'
}

function resolveTaskUrl(path?: string | null) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (!ttsBase) return path
  const needsSlash = !path.startsWith('/')
  return `${ttsBase}${needsSlash ? '/' : ''}${path}`
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
        ? compressed.split('/').pop() || 'tts.ogg'
        : 'tts.ogg',
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
    const status = error.response?.status
    if (status === 429) {
      return '请求过于频繁或已达到今日生成限额，请稍后再试。'
    }
    if (status === 503) {
      return '当前排队任务已满，请稍后再试。'
    }
    if (status === 422) {
      const detail = error.response?.data?.detail
      return typeof detail === 'string' && detail.trim()
        ? `参数校验失败：${detail}`
        : '输入参数无效，请检查角色与生成文本。'
    }
    if (status === 404) {
      return '任务不存在或已过期。'
    }
    if (status && status >= 500) {
      return 'TTS 服务暂时不可用，请稍后再试。'
    }
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
  if (!ttsBase) return
  try {
    const response = await axios.get(`${ttsBase}/tasks/${taskIdValue}`)
    updateHistoryItem(taskIdValue, response.data as TaskStatus)
  } catch {
    // ignore refresh errors for history items
  }
}

function reuseHistoryItem(item: HistoryItem) {
  selectedSpeaker.value = item.speaker || null
  if (item.referenceAudioId) {
    store.ttsReference = {
      speaker: item.speaker,
      text: item.referenceText || '',
      audioId: item.referenceAudioId,
    }
    referenceAudioId.value = item.referenceAudioId
    referenceText.value = item.referenceText || ''
  } else {
    store.ttsReference = null
    referenceAudioId.value = ''
    referenceText.value = ''
  }
  captionText.value = item.caption || ''
  ttsText.value = item.ttsText || ''
  errorMessage.value = ''
  panelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  if (!selectedSpeaker.value || !ttsBase) return
  const normalizedText = ttsText.value.trim()
  if (!normalizedText) return

  submitting.value = true
  errorMessage.value = ''
  const normalizedCaption = captionText.value.trim()
  const activeReferenceId = referenceAudioId.value.trim()
  const activeReferenceText = activeReferenceId ? referenceText.value : ''
  const mode: VoiceMode = activeReferenceId ? 'reference' : 'embed'

  const payload: Record<string, string> = {
    character_name: selectedSpeaker.value,
    reference_audio_id: activeReferenceId,
    reference_audio_text: activeReferenceText,
    text: normalizedText,
  }
  if (normalizedCaption) {
    payload.caption = normalizedCaption
  }

  try {
    const response = await axios.post(`${ttsBase}/tasks`, payload)
    taskId.value = response.data.task_id
    taskStatus.value = null
    sentTtsText.value = normalizedText
    sentSpeaker.value = selectedSpeaker.value
    sentCaption.value = normalizedCaption
    sentVoiceMode.value = mode
    sentReferenceText.value = activeReferenceText
    sentReferenceAudioId.value = activeReferenceId
    sentAt.value = new Date()
    addHistoryItem({
      taskId: taskId.value,
      sentAt: sentAt.value.toISOString(),
      ttsText: sentTtsText.value,
      speaker: sentSpeaker.value,
      caption: sentCaption.value,
      voiceMode: sentVoiceMode.value,
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
  const currentTaskId = taskId.value
  if (!currentTaskId || !ttsBase) return
  try {
    const response = await axios.get(`${ttsBase}/tasks/${currentTaskId}`)
    const status = response.data as TaskStatus
    updateHistoryItem(currentTaskId, status)
    if (taskId.value !== currentTaskId) return
    taskStatus.value = status
    if (!['pending', 'running'].includes(status.status)) {
      stopPolling()
    }
  } catch (error: unknown) {
    if (taskId.value !== currentTaskId) return
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
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 12px;
  align-items: start;
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

.tts-card-voice,
.tts-card-caption {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), #f7faf9);
}

.tts-card-generator {
  border-color: rgba(24, 160, 88, 0.22);
  box-shadow: 0 10px 28px rgba(24, 160, 88, 0.09);
}

.tts-card-generator :deep(.n-card-header) {
  background: linear-gradient(90deg, rgba(24, 160, 88, 0.08), transparent);
}

.tts-card-voice :deep(.n-card-header__main)::before,
.tts-card-caption :deep(.n-card-header__main)::before,
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

.tts-card-voice :deep(.n-card-header__main)::before {
  content: '1';
}

.tts-card-caption :deep(.n-card-header__main)::before {
  content: '2';
}

.tts-card-generator :deep(.n-card-header__main)::before {
  content: '3';
}

.tts-panel :deep(.n-button) {
  margin: 0;
  border-radius: 8px;
}

.tts-panel :deep(.n-input) {
  border-radius: 8px;
}

.speaker-select-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.speaker-select {
  flex: 1;
  min-width: 0;
}

.voice-mode-tag {
  flex: 0 0 auto;
}

.reference-box,
.reference-hint-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(31, 41, 55, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.78);
}

.reference-box-header {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.reference-audio-inline {
  box-sizing: border-box;
  display: flex;
  min-height: 30px;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(24, 160, 88, 0.08);
  font-size: 12px;
  white-space: nowrap;
}

.reference-transcript {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 6px;
  border-top: 1px dashed rgba(31, 41, 55, 0.1);
}

.reference-transcript-label {
  color: var(--tts-muted);
  font-size: 11px;
  font-weight: 600;
}

.reference-transcript-text {
  color: var(--tts-text);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.reference-hint-box {
  align-items: flex-start;
}

.reference-hint-text {
  margin: 0;
  color: var(--tts-muted);
  font-size: 12px;
  line-height: 1.55;
}

.caption-input-header {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.field-hint {
  color: var(--tts-muted);
  font-size: 12px;
}

.caption-lang-hint {
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(240, 160, 32, 0.1);
  color: #9a6400;
  font-size: 12px;
  line-height: 1.45;
}

.preset-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preset-section-title {
  color: var(--tts-muted);
  font-size: 11px;
  font-weight: 600;
}

.caption-preset-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 228px;
  padding-right: 4px;
  overflow-y: auto;
}

.caption-preset-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(31, 41, 55, 0.1);
  border-radius: 9px;
  background: #fff;
  color: var(--tts-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 120ms ease, background-color 120ms ease,
    box-shadow 120ms ease;
}

.caption-preset-item:hover {
  border-color: rgba(24, 160, 88, 0.4);
  background: #f5fbf8;
}

.caption-preset-item--active {
  border-color: var(--tts-accent);
  background: #eef9f3;
  box-shadow: 0 0 0 1px rgba(24, 160, 88, 0.2);
}

.caption-preset-item:focus-visible {
  outline: 2px solid rgba(24, 160, 88, 0.48);
  outline-offset: 1px;
}

.caption-preset-zh {
  color: #1f2d27;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.caption-preset-ja {
  color: var(--tts-muted);
  font-size: 11px;
  line-height: 1.45;
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

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tts-card-generator .action-buttons :deep(.n-button--primary-type) {
  min-width: 116px;
}

.submit-summary {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(24, 160, 88, 0.08);
  color: #355848;
  font-size: 12px;
  font-weight: 500;
}

.submit-summary i {
  font-style: normal;
  opacity: 0.5;
}

.status-error {
  color: #d03050;
}

.status-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
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
  gap: 8px 10px;
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

  .reference-audio-inline {
    width: 100%;
    justify-content: flex-start;
  }

  .action-row {
    align-items: stretch;
    flex-direction: column;
  }

  .action-buttons {
    width: 100%;
  }

  .action-buttons :deep(.n-button) {
    flex: 1;
  }

  .submit-summary {
    justify-content: center;
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
    display: flex;
    flex-wrap: wrap;
    gap: 6px 8px;
  }

  .history-time,
  .history-queue {
    width: 100%;
  }

  .history-actions {
    grid-column: 2;
    grid-row: 1;
    flex-direction: column;
    margin-left: 0;
  }

  .history-actions :deep(.n-button),
  .history-toolbar :deep(.n-button) {
    min-height: 36px;
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

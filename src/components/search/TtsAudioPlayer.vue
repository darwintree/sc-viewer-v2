<template>
  <div
    class="tts-player"
    :class="{
      'tts-player--compact': compact,
      'tts-player--mini': mini,
      'tts-player--playing': isPlaying,
      'tts-player--error': hasError,
    }"
  >
    <audio
      ref="audioRef"
      :src="src"
      :preload="preload"
      @loadedmetadata="syncDuration"
      @durationchange="syncDuration"
      @canplay="syncDuration"
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @error="onError"
    />

    <button
      type="button"
      class="tts-player-toggle"
      :aria-label="
        hasError ? '重试加载试听' : isPlaying ? '暂停试听' : '播放试听'
      "
      @click="togglePlayback"
    >
      <n-icon :size="toggleIconSize" aria-hidden="true">
        <PauseFilled v-if="isPlaying" />
        <PlayFilledAlt v-else />
      </n-icon>
    </button>

    <div v-if="!mini && !hasError" class="tts-player-track">
      <input
        type="range"
        class="tts-player-scrubber"
        min="0"
        :max="sliderMax"
        step="0.05"
        :value="currentTime"
        :disabled="duration <= 0"
        :style="{ '--progress': `${progressPercent}%` }"
        aria-label="音频播放进度"
        :aria-valuetext="scrubberValueText"
        @input="onSeek"
      />
    </div>

    <span v-if="!mini" class="tts-player-time" aria-live="off">
      <template v-if="hasError">暂不可播放（点击重试）</template>
      <template v-else-if="duration > 0">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </template>
      <template v-else>{{
        isPlaying ? formatTime(currentTime) : '试听'
      }}</template>
    </span>
  </div>
</template>

<script lang="ts">
let activeAudioElement: HTMLAudioElement | null = null
</script>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  ref,
  watch,
} from 'vue'
import { NIcon } from 'naive-ui'
import { PauseFilled, PlayFilledAlt } from '@vicons/carbon'

const props = withDefaults(
  defineProps<{
    src: string
    preload?: 'none' | 'metadata' | 'auto'
    compact?: boolean
    mini?: boolean
  }>(),
  {
    preload: 'none',
    compact: false,
    mini: false,
  }
)

const emit = defineEmits<{
  (event: 'playing-change', playing: boolean): void
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const hasError = ref(false)

const toggleIconSize = computed(() => {
  if (props.mini) return 15
  if (props.compact) return 14
  return 16
})

const sliderMax = computed(() => (duration.value > 0 ? duration.value : 1))
const progressPercent = computed(() => {
  if (duration.value <= 0) return 0
  return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100))
})

const scrubberValueText = computed(() => {
  if (duration.value <= 0) return '未加载时长'
  return `${formatTime(currentTime.value)} / ${formatTime(duration.value)}`
})

function setPlaying(next: boolean) {
  if (isPlaying.value !== next) {
    isPlaying.value = next
    emit('playing-change', next)
  }
}

function stopCurrentElement() {
  const el = audioRef.value
  if (!el) return
  el.pause()
  if (activeAudioElement === el) {
    activeAudioElement = null
  }
  setPlaying(false)
}

watch(
  () => props.src,
  async () => {
    stopCurrentElement()
    currentTime.value = 0
    duration.value = 0
    hasError.value = false
    await nextTick()
    audioRef.value?.load()
  }
)

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const whole = Math.floor(seconds)
  const mins = Math.floor(whole / 60)
  const secs = whole % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function togglePlayback() {
  const el = audioRef.value
  if (!el) return
  if (isPlaying.value) {
    el.pause()
    return
  }
  if (hasError.value) {
    hasError.value = false
    el.load()
  }
  if (activeAudioElement && activeAudioElement !== el) {
    activeAudioElement.pause()
  }
  activeAudioElement = el
  el.play().catch((err: unknown) => {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return
    }
    hasError.value = true
    setPlaying(false)
  })
}

function syncDuration() {
  const el = audioRef.value
  if (!el) return
  if (Number.isFinite(el.duration) && el.duration > 0) {
    duration.value = el.duration
    hasError.value = false
  }
}

function onTimeUpdate() {
  const el = audioRef.value
  if (!el) return
  currentTime.value = el.currentTime || 0
  if (duration.value <= 0) {
    syncDuration()
  }
}

function onPlay() {
  hasError.value = false
  setPlaying(true)
}

function onPause() {
  setPlaying(false)
}

function onEnded() {
  if (audioRef.value && activeAudioElement === audioRef.value) {
    activeAudioElement = null
  }
  setPlaying(false)
}

function onError() {
  hasError.value = true
  setPlaying(false)
}

function onSeek(event: Event) {
  const el = audioRef.value
  const target = event.target as HTMLInputElement | null
  if (!el || !target) return
  const nextTime = Number(target.value)
  if (Number.isFinite(nextTime)) {
    el.currentTime = nextTime
    currentTime.value = nextTime
  }
}

onDeactivated(() => {
  stopCurrentElement()
})

onBeforeUnmount(() => {
  stopCurrentElement()
})
</script>

<style scoped>
.tts-player {
  display: flex;
  flex: 1 1 220px;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.tts-player--compact {
  gap: 10px;
}

.tts-player--mini {
  flex: 0 0 auto;
  gap: 0;
  width: auto;
}

.tts-player-toggle {
  display: inline-grid;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  place-items: center;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #1e2a38;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 160ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 160ms cubic-bezier(0.22, 1, 0.36, 1);
}

.tts-player--compact .tts-player-toggle {
  width: 32px;
  height: 32px;
}

.tts-player--playing .tts-player-toggle,
.tts-player-toggle:hover {
  background: var(--tts-accent, #bf486b);
}

.tts-player-toggle:hover {
  transform: scale(1.04);
}

.tts-player-toggle:focus:not(:focus-visible) {
  outline: none;
}

.tts-player-toggle:focus-visible {
  outline: 2px solid var(--tts-accent, #bf486b);
  outline-offset: 2px;
}

.tts-player-track {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 80px;
  min-height: 24px;
}

.tts-player-scrubber {
  width: 100%;
  height: 24px;
  margin: 0;
  padding: 9px 0;
  box-sizing: border-box;
  background: transparent;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.tts-player-scrubber::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--tts-accent, #bf486b) 0%,
    var(--tts-accent, #bf486b) var(--progress, 0%),
    #dde6f0 var(--progress, 0%),
    #dde6f0 100%
  );
}

.tts-player-scrubber::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  margin-top: -4px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: var(--tts-accent, #bf486b);
  box-shadow: 0 1px 4px rgba(30, 42, 56, 0.25);
  appearance: none;
  -webkit-appearance: none;
}

.tts-player-scrubber::-moz-range-track {
  height: 6px;
  border: 0;
  border-radius: 999px;
  background: #dde6f0;
}

.tts-player-scrubber::-moz-range-progress {
  height: 6px;
  border-radius: 999px;
  background: var(--tts-accent, #bf486b);
}

.tts-player-scrubber::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: var(--tts-accent, #bf486b);
  box-shadow: 0 1px 4px rgba(30, 42, 56, 0.25);
}

.tts-player-scrubber:focus:not(:focus-visible) {
  outline: none;
}

.tts-player-scrubber:focus-visible {
  outline: 2px solid var(--tts-accent, #bf486b);
  outline-offset: 2px;
}

.tts-player-scrubber:disabled {
  opacity: 0.5;
  cursor: default;
}

.tts-player-time {
  flex: 0 0 auto;
  color: var(--tts-muted, #556375);
  font-size: var(--tts-fs-sm, 0.8125rem);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tts-player--playing .tts-player-time {
  color: var(--tts-accent-text, #a83b5c);
  font-weight: 600;
}

.tts-player--error .tts-player-time {
  color: #a15c07;
  white-space: normal;
}

@media (max-width: 600px) {
  .tts-player:not(.tts-player--mini) {
    flex: 0 0 auto;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tts-player-toggle {
    transition: none;
  }

  .tts-player-toggle:hover {
    transform: none;
  }
}
</style>

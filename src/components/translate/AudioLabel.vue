<template>
  <label
    v-if="hasAudio"
    class="audio-button clickable"
    :title="audioTitle"
    @click="playAudio"
    >{{ extraText }} {{ audioIcon }}</label
  >

  <n-icon v-if="displayDownload" class="clickable" @click="downloadAudio">
    <Download />
  </n-icon>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { NIcon } from 'naive-ui'
import { Download } from '@vicons/carbon'
import { getAudioPath } from '../../helper/path'

// define the props for the component
export default defineComponent({
  components: {
    NIcon,
    Download,
  },
  props: {
    // the audio file URL
    id: {
      type: String,
      required: true,
    },
    base: {
      type: String,
      required: true,
    },
    // the label text to display next to the audio button
    extraText: {
      type: String,
      required: false,
      default: '',
    },
    // use to change downlownded filename
    // not in use at present
    audioText: {
      type: String,
      required: false,
      default: '',
    },
    displayDownload: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      // define the audio title
      isPlaying: false,
    }
  },
  computed: {
    audioUrl() {
      return getAudioPath(this.id, this.base)
    },
    hasAudio() {
      if (this.id) {
        return this.id !== '0000000000000' && this.id !== 'select'
      }
      return false
    },
    audioTitle() {
      return this.isPlaying ? 'Playing...' : 'Play Audio'
    },
    audioIcon() {
      return this.isPlaying ? '🔊' : '🔈'
    },
  },
  methods: {
    getBaseName(filePath: string) {
      return filePath.split('/').pop()
    },
    sanitizeFilename(name: string) {
      return name.trim().replace(/[\\/:*?"<>|]/g, '_')
    },
    getDownloadFilename() {
      const baseName = this.getBaseName(this.audioUrl) || 'audio.m4a'
      const ext = baseName.includes('.') ? `.${baseName.split('.').pop()}` : ''
      if (!this.audioText) return baseName
      const safeName = this.sanitizeFilename(this.audioText)
      if (!safeName) return baseName
      return `${safeName}${ext || '.m4a'}`
    },
    async triggerDownload(url: string, filename: string) {
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
    },
    // define the "playAudio" function to play the audio file
    playAudio() {
      // create a new Audio object with the audio URL
      const audio: HTMLAudioElement | null = new Audio(this.audioUrl)

      // add an event listener to the audio object to listen for the "ended" event
      audio.addEventListener('ended', () => {
        // when the audio ends, update the audio button title to the default value
        this.isPlaying = false
        audio.removeEventListener('ended', () => null)
      })

      // play the audio file
      audio.play()

      // update the audio button title to indicate that the audio is playing
      this.isPlaying = true
    },
    downloadAudio() {
      this.triggerDownload(this.audioUrl, this.getDownloadFilename())
      // const request = new XMLHttpRequest()
      // request.open('GET', this.audioUrl, true)
      // request.responseType = 'blob'
      // request.onload = (e) => {
      //   if (request.readyState === 4 && request.status === 200) {
      //     const blob = new Blob([request.response], { type: 'audio/wav' })
      //     saveAs(
      //       blob,
      //       this.audioText ? this.audioText : this.getBaseName(this.audioUrl)
      //     )
      //   }
      // }
      // request.send()
    },
  },
})
</script>
<style scoped>
/* define the layout and styling for the "AudioLabel" component */

.clickable {
  cursor: pointer;
}

.audio-button {
  background: transparent;
  border: none;
  font-size: 1em;
}
</style>

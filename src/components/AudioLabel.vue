<template>
  <label class="audio-button" @click="playAudio" :title="audioTitle" v-if="hasAudio">{{ audioIcon }}</label>
  <a target="_blank" :href="audioUrl">                      ↓</a>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { getAudioPath } from '../helper/path'

// define the props for the component
export default defineComponent({
  props: {
    // the audio file URL
    id: {
      type: String,
      required: true,
    },
    base: {
      type: String,
      required: true,
    }
    // the label text to display next to the audio button
  },
  data() {
    return {
      // define the audio title
      isPlaying: false,
    };
  },
  methods: {
    // define the "playAudio" function to play the audio file
    playAudio() {
      // create a new Audio object with the audio URL
      const audio: HTMLAudioElement | null = new Audio(this.audioUrl);

      // add an event listener to the audio object to listen for the "ended" event
      audio.addEventListener('ended', () => {
        // when the audio ends, update the audio button title to the default value
        this.isPlaying = false;
        audio.removeEventListener('ended', () => {})
      });

      // play the audio file
      audio.play();

      // update the audio button title to indicate that the audio is playing
      this.isPlaying = true;
    },
  },
  computed: {
    audioUrl() {
      return getAudioPath(this.id, this.base)
    },
    hasAudio() {
      if (this.id) {
        return this.id !== "0000000000000" && this.id !== "select";
      }
      return false
    },
    audioTitle() { 
      return this.isPlaying? 'Playing...':'Play Audio';
    },
    audioIcon() { 
      return this.isPlaying? '🔊':'🔈';
    }
  },
});
</script>
<style scoped>
/* define the layout and styling for the "AudioLabel" component */

.audio-button {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1em;
}
</style>
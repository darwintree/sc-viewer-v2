<template>
  <label class="audio-button" @click="playAudio" :title="audioTitle" v-if="hasAudio">🔈</label>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

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
      audioTitle: 'Play Audio',
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
        this.audioTitle = 'Play Audio';
        audio.removeEventListener('ended', () => {})
      });

      // play the audio file
      audio.play();

      // update the audio button title to indicate that the audio is playing
      this.audioTitle = 'Playing...';
    },
  },
  computed: {
    audioUrl() {
      return `https://strawberrytree.top/convert/cache/sounds/voice/events/${this.base}/${this.id}.m4a`
    },
    hasAudio() {
      if (this.id) {
        return this.id !== "0000000000000" && this.id !== "select";
      }
      return false
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
  font-size: 0.8em;
}
</style>
<template>
  <div class="aspect-ratio">
    <iframe :src="iframeSrc" frameborder="0"></iframe>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    iframeSrc: {
      type: String,
      required: true,
    }
  },
})
</script>

<style scoped>
.aspect-ratio {

  position: relative;

  width: 100%;

  height: 0;

  padding-bottom: 56%;

}

.aspect-ratio>iframe {

  position: absolute;

  width: 100%;

  height: 100%;

  left: 0;

  top: 0;

}
</style>
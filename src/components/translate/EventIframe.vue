<template>
  <div ref="frame" class="aspect-ratio">
    <iframe
      ref="player"
      :hidden="!loaded"
      :src="iframeSrc"
      frameborder="0"
    ></iframe>
    <NSkeleton v-if="!loaded" :height="skeletonHeight"></NSkeleton>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NSkeleton } from 'naive-ui'

onMounted(() => {
  window.onmessage = (event) => {
    if (event.data.eventViewerIframeLoaded) {
      loaded.value = true
    }
  }
})

const frame = ref<InstanceType<typeof HTMLDivElement> | null>(null)

const skeletonHeight = computed(() => {
  if (!frame?.value) {
    return 0
  }
  return (frame.value.clientWidth * 640) / 1136
})

const loaded = ref(false)

const iframeSrc = ref(undefined as string | undefined)

const player = ref<InstanceType<typeof HTMLIFrameElement> | null>(null)

function postMessageOnPlayer({
  iframeJson,
  csvText,
}: {
  iframeJson: object
  csvText: string
}) {
  iframeSrc.value = `https://event.strawberrytree.top/?iframeMode=1`
  if (loaded.value) {
    player?.value?.contentWindow?.postMessage(
      {
        iframeJson,
        csvText,
      },
      '*'
    )

    return
  }
  window.setTimeout(() => {
    postMessageOnPlayer({
      iframeJson,
      csvText,
    })
  }, 1000)
}

defineExpose({
  postMessageOnPlayer,
  iframeSrc,
})
</script>

<style scoped>
.aspect-ratio {
  position: relative;

  width: 100%;

  height: 0;

  padding-bottom: 56%;
}

.aspect-ratio > iframe {
  position: absolute;

  width: 100%;

  height: 100%;

  max-height: 95vh;

  left: 0;

  top: 0;
}
</style>

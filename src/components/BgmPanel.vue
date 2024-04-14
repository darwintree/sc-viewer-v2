<template>
  <div>
    <n-space vertical justify="center">
      <n-input-group>
        <n-input
          v-model:value="bgmInput"
          placeholder="BGM Index"
          @keydown.enter="changeBgm"
        />
        <n-button type="info" @click="changeBgm">search</n-button>
      </n-input-group>
      <AVWaveform
        v-if="bgmPath"
        :src="bgmPath"
        :playtime-clickable="false"
      ></AVWaveform>
      <span v-else> No BGM selected </span>
    </n-space>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NSpace, NInput, NInputGroup, NButton } from 'naive-ui'
import { AVWaveform } from 'vue-audio-visual'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const bgmInput = ref('')
const bgm = ref('')
const bgmPath = computed(() =>
  bgm.value
    ? `https://service.sc-viewer.top/convert/cache/sounds/bgm/${bgm.value}.m4a`
    : null
)

function changeBgm() {
  bgm.value = ''
  nextTick(() => {
    bgm.value = bgmInput.value
    router.replace({
      query: {
        bgmIndex: bgm.value,
      },
    })
  })
}

onMounted(() => {
  const bgmQuery = route.query.bgmIndex
  if (bgmQuery != null) {
    bgmInput.value = bgmQuery.toString()
    bgm.value = bgmQuery.toString()
  }
})
</script>
<style scoped>
.info-container {
  text-align: left;
}
</style>

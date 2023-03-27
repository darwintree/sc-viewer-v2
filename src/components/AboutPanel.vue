<template>
  <div class="info-container">
    <br />
    <div>
      <a
        target="_blank"
        href="https://github.com/darwintree/sc-viewer-v2/issues"
      >
        {{ t('about.feedback') }}
      </a>
    </div>
    <div>
      <a
        target="_blank"
        href="https://static.sc-viewer.top/viewer-button.user.js"
        >{{ t('about.userscript') }}</a
      >
    </div>
    <div>
      {{ t('about.thanks') }}:
      <a
        target="_blank"
        href="https://github.com/ShinyColorsDB/ShinyColorsDB-EventViewer"
        >ShinyColorsDB-EventViewer</a
      >
    </div>
    <div>
      <a target="_blank" href="https://docs.sc-viewer.top">{{
        t('about.manual')
      }}</a>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
<style scoped>
.info-container {
  text-align: left;
}
</style>

<template>
  <div class="info-container">
    <br />
    <div>
      <a
        target="_blank"
        href="https://github.com/imas-tools/gakumas-viewer/issues"
      >
        {{ t('about.feedback') }}
      </a>
    </div>
    <div>
      <a
        target="_blank"
        href="https://github.com/imas-tools/gakumas-viewer/raw/gkmas/public/viewer-button.user.js"
        >{{ t('about.userscript') }}</a
      >
    </div>
    <!-- <div>
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
    </div> -->
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { inject } from '@vercel/analytics'

inject()

const { t } = useI18n()
</script>
<style scoped>
.info-container {
  text-align: left;
}
</style>

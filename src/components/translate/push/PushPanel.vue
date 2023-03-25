// User.vue

<template>
  <n-space vertical class="user-container">
    <div v-if="!store.isLoading" class="full-width">
      <n-collapse>
        <n-collapse-item :title="t('push.explanation.title')">
          <p>
            {{ t('push.explanation.p1') }}
          </p>

          <p>
            {{ t('push.explanation.p2') }}
          </p>
          <ol>
            <li>
              {{ t('push.explanation.step1') }}
            </li>
            <li>
              {{ t('push.explanation.step2') }}
            </li>
            <li>
              {{ t('push.explanation.step3') }}
            </li>
          </ol>
        </n-collapse-item>
      </n-collapse>
      <push-steps></push-steps>
    </div>
  </n-space>
</template>

<script setup lang="ts">
import { store } from '../../../store'
import { useI18n } from 'vue-i18n'
import { NCollapse, NCollapseItem, NSpace } from 'naive-ui'
import PushSteps from './PushSteps.vue'

const { t } = useI18n()
</script>

<style scoped>
.n-collapse {
  margin-bottom: 15px;
}
</style>

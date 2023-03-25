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
import { ref } from 'vue'
import { store } from '../../../store'
import { useI18n } from 'vue-i18n'
import { NCollapse, NCollapseItem, NSpace } from 'naive-ui'
import PushSteps from './PushSteps.vue'

const { t } = useI18n()
</script>

<style scoped>
.n-collapse {
  margin: 10px;
}

.full-width {
  width: 100%;
}

/* .user-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
} */

.logged-out {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.logged-in {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.user-info-line {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  margin-left: 10px;
  font-size: 1.2em;
}

.avatar {
  height: 50px;
  border-radius: 50%;
}

.commit-card {
  width: 100%;
}

.pre-wrap {
  white-space: pre-wrap;
}
</style>

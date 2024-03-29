<template>
  <n-steps
    :vertical="store.isMobile"
    :current="current"
    :status="currentStatus"
    @update:current="
      (currentStep) => {
        current = currentStep
      }
    "
  >
    <n-step :title="t('push.steps.branch.title')">
      <div class="n-step-description">
        <branch-controller
          ref="branchController"
          :current="current"
          @next="handleButtonClick"
        />
      </div>
    </n-step>
    <n-step :disabled="!hasWorkingBranch" :title="t('push.steps.upload.title')">
      <div class="n-step-description">
        <!-- <p>1. dropdown选择branch（如果选择的分支过老/为main分支会警告）</p>
        <p>
          2. 选择提交路径（metadata service可用时有准确路径，也可以自行指定）
        </p>
        <p>3. 填commit message（有默认模板），也可以自己填，用tab切换</p>
        <p>4. 给commit链接。并提醒可以先不提PR</p> -->
        <p v-if="current === 2 && pullController?.pullUrl">
          {{ t('push.steps.pr.detected') }}
        </p>
        <commit-card
          :current="current"
          :current-branch="currentBranch"
          @commit="
            () => {
              branchController?.updateBranchComparison(currentBranch!)
            }
          "
        ></commit-card>
      </div>
    </n-step>
    <n-step :disabled="!hasWorkingBranch" :title="t('push.steps.pr.title')">
      <div class="n-step-description">
        <!-- <p>1. 创建PR（有默认模板），也可以自己填，用tab切换</p>
        <p>2. 提醒管理员合并。合并前可以继续推送更改</p>
        <p>如果已提交过PR展示PR相关信息</p> -->
        <pull-controller
          ref="pullController"
          :current="current"
          :current-branch="currentBranch"
        ></pull-controller>
      </div>
    </n-step>
  </n-steps>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { StepsProps, NSteps, NStep } from 'naive-ui'
import BranchController from './BranchController.vue'
import CommitCard from './CommitCard.vue'
import { store } from '../../../store'
import PullController from './PullController.vue'

const { t } = useI18n()
const current = ref(1)
const currentStatus = ref<StepsProps['status']>('process')

const branchController = ref<InstanceType<typeof BranchController>>()
const pullController = ref<InstanceType<typeof PullController>>()

const currentBranch = computed(() => {
  if (!branchController?.value?.currentBranch) return null
  return branchController.value.currentBranch
})

const hasWorkingBranch = computed(() => {
  return !!branchController.value?.branchComparison
})

function handleButtonClick() {
  current.value = (current.value % 3) + 1
}
</script>

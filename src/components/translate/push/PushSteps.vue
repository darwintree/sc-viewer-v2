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
    <n-step title="选择工作分支">
      <div class="n-step-description">
        <fork-step-controller
          ref="forkStep"
          :current="current"
          @next="handleButtonClick"
        />
      </div>
    </n-step>
    <n-step :disabled="!hasWorkingBranch" title="将翻译推送至工作分支">
      <div class="n-step-description">
        <!-- <p>1. dropdown选择branch（如果选择的分支过老/为main分支会警告）</p>
        <p>
          2. 选择提交路径（metadata service可用时有准确路径，也可以自行指定）
        </p>
        <p>3. 填commit message（有默认模板），也可以自己填，用tab切换</p>
        <p>4. 给commit链接。并提醒可以先不提PR</p> -->
        <commit-card :current="current"></commit-card>
        <n-button
          v-if="current === 2"
          :type="buttonType"
          size="small"
          @click="handleButtonClick"
        >
          Next
        </n-button>
      </div>
    </n-step>
    <n-step :disabled="!hasWorkingBranch" title="提交合并请求">
      <div class="n-step-description">
        <!-- <p>1. 创建PR（有默认模板），也可以自己填，用tab切换</p>
        <p>2. 提醒管理员合并。合并前可以继续推送更改</p>
        <p>如果已提交过PR展示PR相关信息</p> -->
        <pull-controller
          :current="current"
          :current-branch="currentBranch"
        ></pull-controller>
      </div>
    </n-step>
    <!-- <n-step title="Something">
      <div class="n-step-description">
        <p>Something in the way she moves Attracts me like no other lover</p>
        <n-button
          v-if="current === 4"
          :type="buttonType"
          size="small"
          @click="handleButtonClick"
        >
          Next
        </n-button>
      </div>
    </n-step> -->
  </n-steps>
  <!-- <n-radio-group v-model:value="currentStatus" size="medium" name="basic">
      <n-radio-button value="error"> Error </n-radio-button>
      <n-radio-button value="process"> Process </n-radio-button>
      <n-radio-button value="wait"> Wait </n-radio-button>
      <n-radio-button value="finish"> Finish </n-radio-button>
    </n-radio-group> -->
  <!-- </n-space> -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  StepsProps,
  NSteps,
  NRadioGroup,
  NRadioButton,
  NStep,
  NButton,
  NSpace,
  NTag,
} from 'naive-ui'
import ForkStepController from './ForkStepController.vue'
import CommitCard from './CommitCard.vue'
import { store } from '../../../store'
import { rootRepoName, rootOwner, BranchComparison } from '../../../helper/auth'
import PullController from './PullController.vue'

const current = ref(1)
const currentStatus = ref<StepsProps['status']>('process')

const buttonType = computed(() => {
  switch (currentStatus.value) {
    case 'error':
      return 'error'
    case 'finish':
      return 'success'
    default:
      return 'default'
  }
})

const forkStep = ref<InstanceType<typeof ForkStepController>>()

const currentBranch = computed(() => {
  if (!forkStep?.value?.currentBranch) return null
  return forkStep.value.currentBranch
})

const hasWorkingBranch = computed(() => {
  return !!forkStep.value?.branchComparison
})

function handleButtonClick() {
  current.value = (current.value % 3) + 1
}

// defineExpose({
//   current: currentRef,
//   currentStatus: currentStatusRef,
//   handleButtonClick() {
//     currentRef.value = (currentRef.value % 4) + 1
//   },
//   buttonType: buttonTypeRef,
// })
</script>

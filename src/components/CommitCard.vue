// CommitCard.vue

<template>
  <div class="repository-info">
    <div>Owner: <input v-model="store.owner" /></div>
    <div>Repo: <input v-model="store.repo" /></div>
    <div>Path: {{ store.path }}</div>
    <n-input-group>
      <n-select v-model:value="pathIdol" :options="idolOptions" :style="{ width: '33%', 'min-width': '120px' }" />
      <n-input-group-label>/</n-input-group-label>
      <n-input v-model:value="pathStory" placeholder="Please Input Story Name" />
    </n-input-group>
    <n-input-group>
      <n-input-group-label>/</n-input-group-label>
      <n-input v-model:value="pathChapter" />
    </n-input-group>
  </div>
  <div>
    <input :placeholder="placeholder" :disabled="isUpdating || !store.base64content" v-model="message" />
    
    <n-tooltip trigger="hover">
      <template #trigger>
        <button @click="update" :disabled="isUpdating || !store.base64content" class="btn btn-primary">{{ updateText }}</button>
      </template>
      <span v-if="!store.base64content">No Edit is Found</span>
      <span v-else>Publish to {{ store.owner }}/{{ store.repo }}</span>
    </n-tooltip>
  </div>
  <div v-if="commitUrl">
    <span>Commit Success!</span>
    <a :href="commitUrl" target="_blank" class="commit-url"> Github Link ↗</a>
    <span>{{ commitDate }}</span>
  </div>
</template>

<script setup lang="ts">
import { forkBranch, updateContent } from '../helper/auth';
import { NSelect, NInputGroup, NInput, NInputGroupLabel, NTooltip } from 'naive-ui'
import { ref, computed, WritableComputedRef } from 'vue'
import { store } from '../store';
import { idolOptions } from '../helper/path';

const isUpdating = ref(false);
const commitUrl = ref("")
const commitDate = ref("")
const updateText = computed(()=>{
  return isUpdating.value?"Updating":"Publish";
})
const placeholder = "input commit message"
const message = ref("")

const pathSplits: WritableComputedRef<string[]> = computed({
  get(){
    return store.path.split("/");
  },
  set(newValue: string[]) {
    store.path = newValue.join("/")
  }
})

const pathIdol = computed({
  get() {
    return pathSplits.value[2]
  }, 
  set(newValue: string) {
    pathSplits.value[2] = newValue;
    pathSplits.value = pathSplits.value
  }
})

const pathStory = computed({
  get() {
    return pathSplits.value[3]
  }, 
  set(newValue: string) {
    pathSplits.value[3] = newValue;
    pathSplits.value = pathSplits.value
  }
})

const pathChapter = computed({
  get() {
    return pathSplits.value[4]
  }, 
  set(newValue: string) {
    pathSplits.value[4] = newValue;
    pathSplits.value = pathSplits.value
  }
})


async function fork() {
  const result = await forkBranch(store.accessToken!)
  console.log(result)
}

function checkInput() {
  if (!pathIdol.value) {
    alert("idol name in path is not selected!")
    throw new Error("idol is not selected")
  }
  if (!pathStory.value) {
    alert("story name in path is empty!")
    throw new Error("story is empty")
  }
  if (!pathChapter.value) {
    alert("file name in path is empty!")
    throw new Error("filename is empty")
  }
  if (!message.value) {
    alert("commit message is empty!")
    throw new Error("commit message is empty")
  }
}

async function update() {
  checkInput()
  isUpdating.value = true
  const result = await updateContent(store.accessToken!, store.path, message.value, store.base64content!, store.repo)
  isUpdating.value = false
  store.base64content = null
  console.log(result)
  commitUrl.value = result.commit.html_url
  commitDate.value = new Date(result.commit.author.date).toLocaleTimeString()
  message.value = ""
}
</script>

<style scoped>
.user-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

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

.actions {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 20px;
}

.repository-info {
  display: flex;
  flex-direction: column;
  align-items: left;
  margin-bottom: 20px;
  text-align: left;
  width: 100%;
}

.commit-url {
  color: blue;
}

.n-input {
  flex-wrap: wrap;
}
</style>

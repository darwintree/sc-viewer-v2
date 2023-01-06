<template>
  <n-collapse>
    <n-collapse-item title="Changelog">
      <div class="changelog" v-html="changelogHtml"></div>
      <template #header-extra>
        <n-tag type="info" size="small">
          {{ changelogBrief }}
        </n-tag>
      </template>
    </n-collapse-item>
  </n-collapse>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NCollapse, NCollapseItem, NTag } from 'naive-ui';
import MarkdownIt from 'markdown-it'

let changelogHtml = ref("")
let changelogBrief = ref("")
onMounted(async ()=>{
  const res = await fetch("./CHANGELOG.md")
  if (!res.ok) {
    alert("CHNANGELOG Missing")
    return
  }
  const text = (await res.text()).replaceAll("\r\n", "\n").replace("# Changelog\n\n", "");
  let regex = /##\ (.+)/g;
  let match = regex.exec(text);
  console.log(text)
  console.log(match![1])
  changelogHtml.value = (new MarkdownIt()).render(text)
  changelogBrief.value = `latest update: ${match![1]}`
})

</script>
<style scoped>
.changelog {
  text-align: left;
}
</style>

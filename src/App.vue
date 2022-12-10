<script setup lang="ts">
import Communication from './components/Communication.vue';
import { ref } from 'vue';

let csvUrl = ref('/301701201.csv');
let communication = ref(null);

function loadCsv() {
  // trigger the "loadCsv" method in the "Communication" component
  if (communication.value !== null)
    communication.value.loadCsv();
}

</script>
<template>
  <div class="main">
    <div class="input-row">
      <input v-model="csvUrl" placeholder="Enter CSV URL" />
      <button @click="loadCsv">Confirm</button>
    </div>
    <Communication :csvUrl="csvUrl" ref="communication" />
  </div>
</template>
<style scoped>
.input-row {
  display: flex;
  flex: 8;
}

.input-row > input {
  flex: 6
}
</style>
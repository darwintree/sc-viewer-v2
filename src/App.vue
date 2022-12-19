// App.vue

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { ref, computed } from 'vue'

function toAbout() {
  ;
}

let locationHash = computed(()=>{
  return window.location.hash
})


</script>
<template>
  <div class="main">
    <nav>
      <router-link :to="`/${locationHash}`">Main</router-link> |
      <router-link :to="`/about${locationHash}`">About</router-link>
    </nav>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>
<style scoped>
</style>
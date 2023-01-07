// App.vue

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { ref, computed } from 'vue'

let locationHash = ref(window.location.hash)
let locationSearch = ref(window.location.search)

window.addEventListener('hashchange', function () {
  locationHash.value = window.location.hash
});

window.addEventListener('searchchange', function () {
  locationSearch.value = window.location.search
});

</script>
<template>
  <div class="main">
    <nav>
      <router-link :to="`/${locationSearch}${locationHash}`">Home</router-link> |
      <router-link :to="`/translate${locationSearch}${locationHash}`">Translate</router-link> |
      <router-link :to="`/about${locationSearch}${locationHash}`">About</router-link> |
      <router-link :to="`/user${locationSearch}${locationHash}`">Github</router-link>
    </nav>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>
<style scoped>
.main {
  margin: 0.8em
}
</style>

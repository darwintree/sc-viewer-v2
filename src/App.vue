// App.vue

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';

const route = useRoute()

</script>
<template>
  <div class="main">
    <nav>
      <router-link :to="{ path: '/', query: route.query, hash: route.hash }">Home</router-link> |
      <router-link :to="{ path: '/translate', query: route.query, hash: route.hash }">Translate</router-link> |
      <router-link :to="{ path: '/about', query: route.query, hash: route.hash }">About</router-link> |
      <router-link :to="{ path: '/user', query: route.query, hash: route.hash }">Github</router-link>
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

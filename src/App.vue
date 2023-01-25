// App.vue

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { NSelect, NMessageProvider } from 'naive-ui';

const route = useRoute()
const { locale, availableLocales, t } = useI18n();

const options = availableLocales.map(
  (item) => {
    return {
      label: item,
      value: item,
    }
  }
)

</script>
<template>
  <div class="main">
  <n-message-provider>
    <div class="first-line">
      <nav>
        <router-link :to="{ path: '/', query: route.query, hash: route.hash }">{{ t("tab.Home") }}</router-link> |
        <router-link :to="{ path: '/translate', query: route.query, hash: route.hash }">{{ t("tab.Translate") }}</router-link> |
        <router-link :to="{ path: '/about', query: route.query, hash: route.hash }">{{ t("tab.About") }}</router-link> |
        <router-link :to="{ path: '/user', query: route.query, hash: route.hash }">{{ t("tab.Github") }}</router-link>
      </nav>
      <div class="locale-changer">
        <n-select v-model:value="locale" :options="options" size="small" />
      </div>
    </div>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </n-message-provider>
  </div>
</template>
<style scoped>
.main {
  margin: 0.8em
}

.first-line {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 5px 0;
}

.locale-changer {
  margin: 0 0 0 10px;
  width: 65px;
}
</style>

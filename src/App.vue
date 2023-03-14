// App.vue

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NSelect, NMessageProvider, NDialogProvider } from 'naive-ui'

const route = useRoute()
const { locale, availableLocales, t } = useI18n()

const options = availableLocales.map((item) => {
  return {
    label: item,
    value: item,
  }
})

onMounted(() => {
  if (localStorage.getItem('locale')) {
    locale.value = localStorage.getItem('locale')!
  }
})

watch(locale, (newVal) => {
  localStorage.setItem('locale', newVal)
})
</script>
<template>
  <div class="main">
    <n-message-provider>
      <n-dialog-provider>
        <div class="first-line">
          <nav>
            <router-link
              :to="{ path: '/', query: route.query, hash: route.hash }"
              >{{ t('tab.Home') }}</router-link
            >
            |
            <router-link
              :to="{ path: '/translate', query: route.query, hash: route.hash }"
              >{{ t('tab.Translate') }}</router-link
            >
            |
            <router-link
              :to="{ path: '/about', query: route.query, hash: route.hash }"
              >{{ t('tab.About') }}</router-link
            >
            <!-- |
            <router-link
              :to="{ path: '/user', query: route.query, hash: route.hash }"
              >{{ t('tab.Github') }}</router-link
            > -->
            |
            <router-link
              :to="{ path: '/list', query: route.query, hash: route.hash }"
              >{{ t('tab.List') }}</router-link
            >
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
      </n-dialog-provider>
    </n-message-provider>
  </div>
</template>
<style scoped>
.main {
  margin: 0.8em;
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

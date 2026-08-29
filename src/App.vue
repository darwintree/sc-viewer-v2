// App.vue

<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { RouterView, useRoute, type RouteLocationRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NSelect,
  NNotificationProvider,
  NDialogProvider,
  NAlert,
} from 'naive-ui'

const route = useRoute()
const { locale, availableLocales, t } = useI18n()

const showAlert = computed(() => {
  // return location.hostname === 'viewer.strawberrytree.top'
  return true
})

const options = availableLocales.map((item) => {
  return {
    label: item,
    value: item,
  }
})

const secondaryItems = computed(() => [
  { path: '/list', label: t('tab.List') },
  { path: '/search', label: t('tab.Search') },
  { path: '/bgm', label: 'Sound' },
  { path: '/about', label: t('tab.About') },
])
const currentSecondary = computed(() =>
  secondaryItems.value.find((item) => item.path === route.path)
)
const overflowItems = computed(() =>
  secondaryItems.value.filter((item) => item.path !== route.path)
)

function navTo(path: string): RouteLocationRaw {
  return { path, query: route.query, hash: route.hash }
}

onMounted(() => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale) locale.value = savedLocale
})

watch(locale, (newVal) => {
  localStorage.setItem('locale', newVal)
})
</script>
<template>
  <div class="main">
    <n-notification-provider placement="top" :max="2">
      <n-dialog-provider>
        <!-- <n-alert v-if="showAlert" type="warning" closable>
          网站后端近日迁移中，可能存在不稳定
        </n-alert> -->
        <header class="topbar">
          <nav class="full-nav">
            <router-link :to="navTo('/')">{{ t('tab.Home') }}</router-link>
            <router-link :to="navTo('/translate')">{{
              t('tab.Translate')
            }}</router-link>
            <router-link
              v-for="item in secondaryItems"
              :key="item.path"
              :to="navTo(item.path)"
              >{{ item.label }}</router-link
            >
          </nav>
          <nav class="priority-nav">
            <router-link :to="navTo('/')">{{ t('tab.Home') }}</router-link>
            <router-link :to="navTo('/translate')">{{
              t('tab.Translate')
            }}</router-link>
            <router-link
              v-if="currentSecondary"
              class="current-page"
              :to="navTo(currentSecondary.path)"
              >{{ currentSecondary.label }}</router-link
            >
          </nav>
          <div class="topbar-tools">
            <n-select v-model:value="locale" :options="options" size="small" />
            <details class="mobile-menu">
              <summary aria-label="更多导航">⋯</summary>
              <div class="mobile-popover">
                <nav>
                  <router-link
                    v-for="item in overflowItems"
                    :key="item.path"
                    :to="navTo(item.path)"
                    >{{ item.label }}</router-link
                  >
                </nav>
              </div>
            </details>
          </div>
        </header>
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </n-dialog-provider>
    </n-notification-provider>
  </div>
</template>
<style scoped>
.main {
  margin: 0.8em;
}

.topbar {
  position: sticky;
  z-index: 10;
  top: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  width: 100vw;
  margin: -0.8em 0 14px calc(50% - 50vw);
  padding: 11px max(18px, calc((100vw - 900px) / 2));
  box-sizing: border-box;
  border-bottom: 1px solid #dfe7ef;
  background: linear-gradient(
    90deg,
    rgb(255 255 255 / 97%),
    rgb(247 251 255 / 95%)
  );
  box-shadow: 0 4px 18px rgb(65 83 103 / 8%);
  backdrop-filter: blur(14px);
}

.full-nav,
.priority-nav {
  display: flex;
  gap: 4px;
}

.priority-nav {
  display: none;
}

.topbar nav a {
  padding: 7px 10px;
  border-radius: 8px;
  color: #637083;
  font-size: 12px;
}

.topbar nav a:hover,
.topbar nav a.router-link-exact-active {
  background: #fff0f4;
  color: #bf486b;
}

.topbar nav a.router-link-exact-active {
  font-weight: 700;
}

.topbar-tools {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 8px;
}

.topbar-tools > .n-select {
  width: 65px;
}

.mobile-menu {
  position: relative;
  display: none;
}

.mobile-menu summary {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid #dfe4ea;
  border-radius: 8px;
  background: white;
  color: #4f5c6d;
  cursor: pointer;
  list-style: none;
}

.mobile-menu summary::-webkit-details-marker {
  display: none;
}

.mobile-popover {
  position: absolute;
  top: 42px;
  right: 0;
  min-width: 150px;
  padding: 6px;
  border: 1px solid #dfe4ea;
  border-radius: 11px;
  background: white;
  box-shadow: 0 12px 30px rgb(33 36 45 / 18%);
}

.mobile-popover nav {
  display: grid;
}

@media (max-width: 650px) {
  .topbar {
    padding-inline: 14px;
  }

  .full-nav {
    display: none;
  }

  .priority-nav {
    display: flex;
    min-width: 0;
    overflow: hidden;
  }

  .topbar .priority-nav a {
    flex: 0 0 auto;
    padding-inline: 7px;
  }

  .priority-nav .current-page {
    max-width: 76px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-menu {
    display: block;
  }

  .topbar-tools {
    gap: 5px;
  }
}
</style>

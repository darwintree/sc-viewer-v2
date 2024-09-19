import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import { messages } from './locale'
import App from './App.vue'
const TranslationPanel = () =>
  import('./components/translate/TranslationPanel.vue')
const About = () => import('./components/AboutPanel.vue')
// const User = () => import('./components/push/UserPanel.vue')
const AuthCallback = () => import('./components/AuthCallback.vue')
const HomePage = () => import('./components/home/HomePage.vue')
const ListPanel = () => import('./components/list/ListPanel.vue')
const CustomPanel = () => import('./components/CustomPanel.vue')
const VoiceSearchPanel = () =>
  import('./components/search/VoiceSearchPanel.vue')
const BgmPanel = () => import('./components/bgm/BgmPanel.vue')

// create a new router instance
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // define your routes here
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/translate',
      component: TranslationPanel,
    },
    {
      path: '/about',
      component: About,
    },
    {
      path: '/bgm',
      component: BgmPanel,
    },
    // {
    //   path: '/user',
    //   component: User,
    // },
    {
      path: '/auth',
      component: AuthCallback,
    },
    {
      path: '/list',
      component: ListPanel,
    },
    {
      path: '/custom',
      component: CustomPanel,
    },
    {
      path: '/search',
      component: VoiceSearchPanel,
    },
  ],
})

const i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
  locale: 'zh', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages, // set locale messages
  // If you need to specify other options, you can set other options
  // ...
})

createApp(App).use(router).use(i18n).mount('#app')

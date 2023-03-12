import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import { messages } from './locale'
import App from './App.vue'
const TranslationPanel = () =>
  import('./components/translate/TranslationPanel.vue')
const About = () => import('./components/AboutPanel.vue')
const User = () => import('./components/push/UserPanel.vue')
const AuthCallback = () => import('./components/push/AuthCallback.vue')
const HomePage = () => import('./components/home/HomePage.vue')

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
      path: '/user',
      component: User,
    },
    {
      path: '/auth',
      component: AuthCallback,
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

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router';
import './style.css'
import App from './App.vue'
import TranslationPanel from './components/TranslationPanel.vue';
import About from './components/About.vue';
import User from './components/User.vue';
import AuthCallback from './components/AuthCallback.vue';

// create a new router instance
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // define your routes here
    {
      path: '/',
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
    }
  ]
});


createApp(App).use(router).mount('#app')

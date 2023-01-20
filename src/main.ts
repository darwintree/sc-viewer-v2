import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router';
import './style.css'
import App from './App.vue'
const TranslationPanel =  () => import('./components/translate/TranslationPanel.vue');
const About = () => import('./components/About.vue');
const User = () =>import('./components/User.vue');
const AuthCallback = () => import('./components/AuthCallback.vue');
const HomePage = () => import('./components/home/HomePage.vue');

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
    }
  ]
});


createApp(App).use(router).mount('#app')

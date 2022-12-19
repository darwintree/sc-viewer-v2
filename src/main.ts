import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router';
import './style.css'
import App from './App.vue'
import TranslationPanel from './components/TranslationPanel.vue';
import AboutVue from './components/About.vue';

// create a new router instance
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // define your routes here
    {
      path: '/', component: TranslationPanel,
    },
    {
      path: '/about', component: AboutVue,
    }
  ]
});


createApp(App).use(router).mount('#app')

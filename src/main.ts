import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import App from './App.vue'
import router from './router'

import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

import axios from './api/axios';

axios.switchServer("/api");

const app = createApp(App)

app.component('font-awesome-icon', FontAwesomeIcon);
import VueVncComponent from "./components/noVNC.vue";

app.component("VueVnc", VueVncComponent);
app.use(createPinia())
app.use(router)
app.use(Antd)

app.mount('#app')

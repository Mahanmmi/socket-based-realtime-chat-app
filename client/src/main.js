import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from 'vue'
import './plugins/bootstrap-vue'
import App from './App.vue'

import axios from 'axios';
import VuejsDialog from 'vuejs-dialog';
import VueMaterial from 'vue-material'
import AnimateCSS from 'animate.css';
import Notifications from 'vue-notification';

import 'vuejs-dialog/dist/vuejs-dialog.min.css';
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'

Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(VuejsDialog);
Vue.use(Notifications);
Vue.use(AnimateCSS);
Vue.use(VueMaterial);

new Vue({
  render: h => h(App),
}).$mount('#app')

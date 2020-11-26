import EasyCamera from './EasyCamera.vue';
import OutputType from './OutputType.js';
import DeviceUtils from './utils/DeviceUtils.js';
export function install(Vue) {
  if(install.installed) return;
  install.installed = true;
  Vue.component('v-easy-camera', EasyCamera);
}
const plugin = {
  install
};


// Auto-install when vue is found (eg. in browser via <script> tag)
let GlobalVue = null;
if (typeof window !== 'undefined') {
	GlobalVue = window.Vue;
} else if (typeof global !== 'undefined') {
	GlobalVue = global.Vue;
}
if (GlobalVue) {
	GlobalVue.use(plugin);
}

export default EasyCamera;
export { DeviceUtils, OutputType };
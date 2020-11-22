<template>
  <div id='app'>
    <easy-camera output="blob" :overlay-mask="require('./assets/grid.png')" must-approve v-model="picture"></easy-camera>
  </div>
</template>

<script>
import EasyCamera from './components/EasyCamera';
export default {
  data() {
    return {
      picture: null
    }
  },
  name: 'App',
  components: {
    EasyCamera
  }
}
</script>
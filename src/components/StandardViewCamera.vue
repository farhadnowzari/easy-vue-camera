<template>
    <div style="position: relative; width: 100%; height: 100;">
        <video :id="videoElementId" autoplay playsinline v-show="!picture"></video>
        <canvas :id="canvasElementId" v-show="picture"></canvas>
    </div>
</template>

<script>
import { v4 as uuid4 } from 'uuid';
import Camera from 'easy-js-camera';

export default {
    data() {
        return {
            camera: null,
            canvasElementId: `canvas-${uuid4().replace(/-/g, '')}`,
            canvas: null,
            picture: null,
            switching: false,
            video: null,
            videoElementId: `video-${uuid4().replace(/-/g, '')}`,
            visibleMask: false,
        }
    },
    methods: {
        close() {
            this.stop();
            this.$emit('close');
        },
        snapAsBlob() {
            if(!this.camera) {
                console.error('Camera not found to take a picture');
                return;
            }            
            return new Promise(resolve => {
                this.camera.snapAsBlob()
                    .then(picture => {
                        this.picture = picture;
                        resolve(picture);
                    });
            });
        }, 
        snapAsDataUrl() {
            if(!this.camera) {
                console.error('Camera not found to take a picture');
                return;
            }
            this.picture = this.camera.snapAsDataUrl();
            this.stop();
            return this.picture;
        },
        start() {
            if(this.camera) {
                this.picture = null;
                this.$emit('loading', true);
                this.camera.start()
                    .finally(() => this.$emit('loading', false));
                return;
            }
            this.video = document.getElementById(this.videoElementId);
            this.canvas = document.getElementById(this.canvasElementId);
            return new Promise(resolve => {
                Camera.tryInvokePermission(this.video, this.canvas)
                    .then(camera => {
                        this.camera = camera;
                        resolve(camera);
                    });
            });
        },
        stop() {
            if(!this.camera) {
                return;
            }
            this.camera.stop();
        },
        switchCamera(tryAgain = false) {
            if(this.switching && !tryAgain) return;
            if(!this.camera) {
                console.error('No camera found to switch...');
                return;
            }
            this.switching = true;
            return new Promise((resolve, reject) => {
                this.camera.switch(tryAgain)
                    .then(() => {
                        this.switching = false;
                        resolve();
                    })
                    .catch(() => {
                        if(!tryAgain) {
                            this.switchCamera(true);
                        } else {
                            this.switching = false;
                            reject();
                        }
                    })
            });
        }
    },
    name: 'standard-view-camera'
}
</script>
<style lang="scss" scoped>
video {
    width: 100%;
    height: auto;
}
canvas {
    width: 100%;
    height: auto;
}
</style>
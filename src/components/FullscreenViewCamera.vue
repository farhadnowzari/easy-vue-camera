<template>
    <div :style="{'z-index': fullscreenZIndex}" class="fullscreen-camera">
        <div class="camera-stack">
            <div class="camera-stack-header">
                <slot name="header"></slot>
                <a  @click="close"
                    class="close-button"
                    role="button"
                    v-if="!hasHeader">&times;</a>
            </div>
            <div class="video-wrapper" v-show="!picture">
                <video :id="videoElementId" autoplay playsinline></video>
                <div :class="{'visible-overlay': visibleOverlay}" class="overlay-mask">
                    <img :src="overlayMask" v-if="visibleMask">
                </div>
            </div>
            <canvas :id="canvasElementId" style="display: none"></canvas>
            <div :style="{'background-image' : `url(${pictureDataUrl})`}" class="camera-snap" v-show="picture"></div>
            <div :class="{'background': !!picture}" class="camera-stack-controls">
                <div class="camera-stack-controls-wrapper">
                    <div class="control-slot">
                        <a @click="visibleMask = !visibleMask" class="secondary-button" role="button" v-if="overlayMask && !picture"><i class="mdi mdi-grid-large"></i></a>
                    </div>
                    <div class="control-slot">
                        <a @click="$emit('snap')" role="button" v-if="!picture"><i class="mdi mdi-circle"></i></a>
                        <a @click="approve" role="button" v-if="picture && mustApprove"><i class="mdi mdi-check"></i></a>
                    </div>
                    <div class="control-slot">
                        <a @click="switchCamera(false)" 
                            :disabled="switching" 
                            class="secondary-button" 
                            role="button" 
                            v-if="multiDevice && !picture"><i class="mdi mdi-camera-switch"></i></a>
                        <a @click="start"
                            class="secondary-button"
                            role="button"
                            v-if="picture"><i class="mdi mdi-camera-retake-outline"></i></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { v4 as uuid4 } from 'uuid';
import Camera from 'easy-js-camera';

export default {
    computed: {
        hasHeader() {
            return typeof this.$slots.header !== 'undefined' && this.$slots.header !== null;
        },
        multiDevice() {
            if(!this.camera) return false;
            return this.camera.devices.length > 1;
        }
    },
    data() {
        return {
            camera: null,
            canvasElementId: `canvas-${uuid4().replace(/-/g, '')}`,
            canvas: null,
            picture: null,
            pictureDataUrl: null,
            switching: false,
            video: null,
            videoElementId: `video-${uuid4().replace(/-/g, '')}`,
            visibleMask: false,
        }
    },
    methods: {
        approve() {
            this.$emit('input', this.picture);
            this.$emit('approve', this.picture);
        },
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
            if(!this.mustApprove) {
                this.$emit('input', this.picture);
            }
            return this.picture;
        },
        start() {
            if(this.camera) {
                this.picture = null;
                this.$emit('input', null);
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
    mounted() {
        if(this.startOnMounted) {
            this.$emit('loading', true);
            this.start()
                .then(camera => {
                    if(camera) {
                        camera.start();
                    }
                })
                .finally(this.$emit('loading', false));
        }
    },
    name: 'fullscreen-view-camera',
    props: {
        fullscreenZIndex: Number,
        mustApprove: Boolean,
        overlayMask: String,
        startOnMounted: Boolean,
        visibleOverlay: Boolean,
    },
    watch: {
        picture() {
            if(!this.picture) this.pictureDataUrl = null;
            if(!(this.picture instanceof Blob)) {
                this.pictureDataUrl = this.picture;
            } else {
                var reader = new FileReader();
                reader.readAsDataURL(this.picture);
                reader.onload = () => {
                    this.pictureDataUrl = reader.result;
                }
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.fullscreen-camera {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    .camera-stack {
        display: flex;
        flex-direction: column;
        position: relative;
        height: 100%;
        .camera-stack-header {
            a {
                &.close-button {
                    position: fixed;
                    top: 5px;
                    right: 15px;
                    color: #fff;
                    font-family: Roboto, Tahoma;
                    font-size: 2.5rem;
                    line-height: 40px;
                    font-weight: 300 !important;
                    z-index: 100;
                }
            }
        }
        .video-wrapper {
            height: 100%;
            width: 100%;
            align-self: stretch;
            align-items: center;
            position: relative;
            display: flex;
            flex-direction: column;
            video {
                object-fit: cover;
                position: absolute;
                width: 100%;
                height: 100%;
                z-index: -1;
            }
            .overlay-mask {
                max-width: 50vh;
                max-height: 50vh;
                width: 100%;
                height: 100%;
                margin-top: 10vh;
                &.visible-overlay {
                    box-shadow: 0px 0px 2000px 2000px rgba(0, 0, 0, .8);
                }
                img {
                    width: 100%;
                }
            }
        }
        .camera-snap {
            background-repeat: no-repeat;
            background-position: center;
            background-size: cover;
            width: 100%;
            height: 100%;
        }
        .camera-stack-controls {
            width: 100%;
            display: flex;
            align-items: center;
            position: fixed;
            bottom: 0;
            padding: 5vh 0px;
            &.background {
                background-color: rgba(0, 0, 0, .8) !important;
            }
            .camera-stack-controls-wrapper {
                max-width: 500px;
                width: 100%;
                display: flex;
                align-items: center;
                margin: 0 auto;
                .control-slot {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: .8;
                    a {
                        color: #fff;
                        border-radius: 100%;
                        font-size: 35pt;
                        padding: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0px 0px 1px 2px #fff;
                        i {
                            &:before {
                                display: block !important;
                                line-height: normal !important;
                            }
                        }
                        &.secondary-button {
                            font-size: 15pt;
                            padding: 10px;
                        }
                    }
                }
            }
        }
    }
}
</style>
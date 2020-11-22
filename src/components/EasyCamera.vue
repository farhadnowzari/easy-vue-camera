<template>
    <div class="easy-camera touch-camera">
        <div class="camera-stack">
            <div class="camera-stack-header">
                <slot name="header"></slot>
                <a 
                    @click="close" 
                    class="close-button" 
                    role="button" 
                    v-if="!hasHeader">&times;</a>
            </div>
            <div class="video-wrapper" v-show="!picture">
                <video :id="videoElementId" autoplay playsinline></video>
                <div class="overlay-square">
                    <img :src="overlayMask" v-if="overlayMask && showOverlayMask">
                </div>
            </div>
            <canvas :id="canvasElementId" v-show="picture"></canvas>
            <slot name="controls"></slot>
            <div :class="{'background': !!picture}" class="camera-stack-controls" v-if="!hasControls">
                <div class="camera-stack-controls-wrapper">
                    <div class="control-slot">
                        <a @click="showOverlayMask = !showOverlayMask" class="secondary-button" role="button" v-if="overlayMask && !picture"><i class="mdi mdi-grid-large"></i></a>
                    </div>
                    <div class="control-slot">
                        <a @click="snap" role="button" v-if="!picture"><i class="mdi mdi-circle"></i></a>
                        <a @click="approve" role="button" v-if="picture && mustApprove"><i class="mdi mdi-check"></i></a>
                    </div>
                    <div class="control-slot">
                        <a @click="switchCamera(false)" 
                            :disabled="canSwitch" 
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
import '@mdi/font/css/materialdesignicons.css';
import OutputType from '../OutputType';
import Camera from 'easy-js-camera';
import { v4 as uuid4 } from 'uuid';
import DeviceUtils from '../utils/DeviceUtils';
export default {
    computed: {
        hasControls() {
            return typeof this.$slots.controls !== 'undefined' && this.$slots.controls !== null;
        },
        hasHeader() {
            return typeof this.$slots.header !== 'undefined' && this.$slots.header !== null;
        },
        isTouchScreen() {
            return DeviceUtils.isTouchScreen();
        },
        multiDevice() {
            if(!this.camera) return false;
            return this.camera.devices.length > 1;
        }
    },
    data() {
        return {
            canSwitch: true,
            camera: null,
            canvasElementId: `canvas-${uuid4().replace(/-/g, '')}`,
            canvas: null,
            picture: null,
            showOverlayMask: false,
            videoElementId: `video-${uuid4().replace(/-/g, '')}`,
            video: null
        }
    }, 
    methods: {
        approve() {
            this.$emit('input', this.picture);
            this.$emit('approve', this.picture);
        },
        close() {
            if(this.camera !== null) {
                this.camera.stop();
            }
            this.$nextTick(() => {
                this.$emit('close');        
            })
        },
        snap() {
            if(this.output === OutputType.base64) {
                this.picture = this.camera.snapAsBase64();
                this.stop();
            } else {
                this.camera.snapAsBlob()
                    .then(blob => {
                        this.stop();
                        this.picture = blob;
                        if(!this.mustApprove) {
                            this.$emit('input', this.picture);
                        }
                    })
            }
        },
        start() {
            if(this.camera === null) return;
            this.picture = null;
            this.$emit('input', null);
            this.$emit('loading', true);
            this.camera
                .start()
                .finally(() => { this.$emit('loading', false) });
        },
        stop() {
            if(this.camera === null) return;
            this.camera.stop();
        },
        switchCamera(tryAgain = false) {
            this.canSwitch = false;
            this.camera.switch(tryAgain)
                .catch(() => {
                    if(tryAgain) return;
                    this.switchCamera(true);
                })
                .finally(() => { this.canSwitch = true });
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.canvas = document.getElementById(this.canvasElementId);
            this.video = document.getElementById(this.videoElementId);
            Camera.tryInvokePermission(this.video, this.canvas)
                .then(camera => {
                    this.$emit('loading', true);
                    this.camera = camera;
                    this.camera
                        .start()
                        .finally(() => this.$emit('loading', false));
                })
        });
    },
    name: 'easy-camera',
    props: {
        customActionIcon: {
            type: String,
            default: null
        },
        mustApprove: {
            type: Boolean,
            default: false
        },
        output: {
            type: String,
            default: OutputType.base64
        },
        overlayVisible: {
            type: Boolean,
            default: true,
        },
        overlayMask: {
            type: String,
            default: null
        },
        value: {},
    }
}
</script>

<style lang="scss" scoped>
.easy-camera {
    &.touch-camera {
        position: fixed;
        left: 0;
        top: 0;
        width:100%;   
        height: 100%;
        z-index: 99;
        video {
            object-fit: cover;
        }
    }
    .camera-stack {
        display: flex;
        flex-direction: column;
        position: relative;
        height: 100%;
        .camera-stack-header {
            a.close-button {
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
        .video-wrapper {
            width: 100%;
            height: 100%;
            align-self: stretch;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            video {
                position: absolute;
                width: 100%;
                height: 100%;
                z-index: -1;
            }
            .overlay-square {
                align-self: center;
                max-width: 50vh;
                max-height: 50vh;
                width: 100%;
                height: 100%;
                margin-top: 15vh;
                box-shadow: 0px 0px 2000px 2000px rgba(0, 0, 0, .8);
                background-color: transparent;
                img {
                    width: 100%;
                }
            }
        }
        .camera-stack-controls {
            margin: 0px auto;
            width: 100%;
            height:  100px;
            display: flex;
            align-items: center;
            position: absolute;
            padding-bottom: 20px;
            bottom: 0px;
            &.background {
                background-color: rgba(0, 0, 0, .8);
            }
            .camera-stack-controls-wrapper {
                max-width: 500px;
                width: 100%;
                display: flex;
                margin: 0 auto;
                align-items: center;
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
                        i{
                            &:before {
                                display: block !important;
                                line-height: unset !important;
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
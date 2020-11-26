<template>
    <div :class="{'fullscreen-camera': (isTouchScreen && autoDetectMobile) || fullscreen}" class="easy-camera">
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
            <canvas :id="canvasElementId" style="display: none"></canvas>
            <div :style="{'background-image': `url(${pictureDataUrl})`}" class="camera-snap" v-show="picture"></div>
            <div :class="{'background': !!picture}" class="camera-stack-controls" v-if="defaultMobileActions">
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
import OutputType from './OutputType';
import Camera from 'easy-js-camera';
import { v4 as uuid4 } from 'uuid';
import DeviceUtils from './utils/DeviceUtils';
export default {
    computed: {
        hasHeader() {
            return typeof this.$slots.header !== 'undefined' && this.$slots.header !== null;
        },
        isTouchScreen() {
            return DeviceUtils.isTouchScreen();
        },
        multiDevice() {
            if(!this.camera) return false;
            return this.camera.devices.length > 1;
        },
    },
    data() {
        return {
            canSwitch: true,
            camera: null,
            canvasElementId: `canvas-${uuid4().replace(/-/g, '')}`,
            canvas: null,
            picture: null,
            pictureDataUrl: null,
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
            if(this.output === OutputType.dataUrl) {
                this.picture = this.camera.snapAsDataUrl();
                this.stop();
                if(!this.mustApprove) {
                    this.$emit('input', this.picture);
                }
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
                    if(this.startOnMounted)
                        this.camera
                            .start()
                            .finally(() => this.$emit('loading', false));
                });
        });
    },
    name: 'easy-camera',
    props: {
        autoDetectMobile: {
            type: Boolean,
            default: true  
        },
        defaultMobileActions: Boolean,
        fullscreen: Boolean,
        mustApprove: {
            type: Boolean,
            default: false
        },
        output: {
            type: String,
            default: OutputType.dataUrl
        },
        overlayMask: {
            type: String,
            default: null
        },
        startOnMounted: {
            type: Boolean,
            default: true
        },
        value: {},
    },
    watch: {
        picture() {
            if(!this.picture) this.pictureDataUrl = null;
            if(this.output === OutputType.dataUrl) this.pictureDataUrl = this.picture;
            if(!(this.picture instanceof Blob)) return;
            var reader = new FileReader();
            reader.readAsDataURL(this.picture);
            reader.onload = () => {
                this.pictureDataUrl = reader.result;
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.easy-camera {
    &.fullscreen-camera {
        position: fixed;
        left: 0;
        top: 0;
        width:100%;   
        height: 100%;
        z-index: 99;
        .camera-stack {
            min-height: 400px;
            .camera-stack-header {
                display: unset !important;
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
            .camera-snap {
                background-repeat: no-repeat;
                background-position: center;
                background-size: cover;
                width: 100%;
                height: 100%;
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
            .video-wrapper {
                height: 100%;
                overflow: hidden;
                video {
                    object-fit: cover;
                    height: 100% !important;
                }
                .overlay-square {
                    max-width: 50vh;
                    max-height: 50vh;
                    width: 100%;
                    height: 100%;
                    margin-top: 15vh;
                    box-shadow: 0px 0px 2000px 2000px rgba(0, 0, 0, .8);
                    img {
                        width: 100%;
                        max-height: unset !important;        
                        margin: unset !important;                
                    }
                }
            }
        }
    }
    .camera-stack {
        display: flex;
        flex-direction: column;
        position: relative;
        height: 100%;
        .camera-stack-header {
            display: none;
        }
        .camera-snap {
            align-self: stretch;
            background-repeat: no-repeat;
            background-position: center;
            background-size: cover;
            width: 100%;
            height: 100%;
        }
        .video-wrapper {
            width: 100%;
            align-self: stretch;
            position: relative;
            display: flex;
            flex-direction: column;
            video {
                position: absolute;
                width: 100%;
                height: auto;
                z-index: -1;
            }
            .overlay-square {
                align-self: center;
                max-width: 300px;
                max-height: 300px;
                width: 100%;
                height: 100%;
                background-color: transparent;
                img {
                    margin: 40px 0;
                    max-height: 300px;                    
                }
            }
        }
        .camera-stack-controls {
            display: none;
        }
    }
}
</style>
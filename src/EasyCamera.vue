<template>
    <fullscreen-view-camera 
        @approve="(picture) => { this.$emit('approve', picture); this.$emit('input', picture); }"
        @loading="(loading) => {this.$emit('loading', loading)}"
        @snap="snap"
        @close="$emit('close')"
        :fullscreen-z-index="fullscreenZIndex"
        :must-approve="mustApprove"
        :overlay-mask="overlayMask"
        :start-on-mounted="startOnMounted"
        :visible-overlay="visibleOverlay"
        ref="fullscreenCameraRef"
        v-if="viewFullscreen">
        <template v-slot:header>
            <slot name="header"></slot>
        </template>
        </fullscreen-view-camera>
    <standard-view-camera 
        @loading="(loading) => {this.$emit('loading', true)}"
        :overlay-mask="overlayMask"
        :start-on-mounted="startOnMounted"
        :visible-overlay="visibleOverlay"
        ref="standardCameraRef"
        v-else></standard-view-camera>
</template>

<script>
import '@mdi/font/css/materialdesignicons.css';

import FullscreenViewCamera from './components/FullscreenViewCamera.vue';
import StandardViewCamera from './components/StandardViewCamera.vue';
import OutputType from './OutputType';
import DeviceUtils from './utils/DeviceUtils';

export default {
    components: {
        FullscreenViewCamera,
        StandardViewCamera
    },
    computed: {
        isTouchScreen() {
            return DeviceUtils.isTouchScreen();
        },
        multiDevice() {
            if(!this.refCameraComponent) return false;
            return this.refCameraComponent.camera.devices.length > 1;
        },
        refCameraComponent() {
            return this.refFullscreenCamera ? this.refFullscreenCamera : this.refStandardCamera;
        },
        refFullscreenCamera() {
            return this.$refs.fullscreenCameraRef;
        },
        refStandardCamera() {
            return this.$refs.standardCameraRef;
        },
        viewFullscreen() {
            return this.fullscreen || (this.isTouchScreen && this.autoDetectMobile);
        },
        viewStandard() {
            return !this.viewFullscreen;
        },
    },
    data() {
        return {
            camera: null,
        }
    }, 
    methods: {
        close() {
            if(this.refFullscreenCamera) {
                this.refFullscreenCamera.close();
            } else {
                this.stop();
                this.$emit('close');
            }
        },
        snap() {
            if(this.output === OutputType.dataUrl) {
                const picture = this.refCameraComponent.snapAsDataUrl();
                this.stop();
                if(!this.mustApprove || !this.fullscreen) {
                    this.$emit('input', picture);
                }
            } else {
                this.$emit('loading', true);
                this.refCameraComponent.snapAsBlob()
                    .then(picture => {
                        this.stop();
                        if(!this.mustApprove || !this.fullscreen) {
                            this.$emit('input', picture);
                        }
                    }).finally(() => this.$emit('loading', false));
            }
        },
        start() {
            this.$emit('loading', true);
            this.refCameraComponent
                .start((camera) => {
                    if(camera) {
                        this.$emit('loading', true);
                        camera.start()
                            .finally(() => this.$emit('loading', false));
                    }
                });
        },
        stop() {
            if(this.refCameraComponent === null) return;
            this.refCameraComponent.stop();
        },
        switchCamera() {
            if(!this.refCameraComponent) return;
            this.$emit('loading', true);
            this.refCameraComponent.switchCamera(false)
                .finally(() => this.$emit('loading', false));
        },
        toggleMask() {
            if(!this.refStandardCamera) return;
            this.refStandardCamera.toggleMask();
        }
    },
    name: 'easy-camera',
    props: {
        autoDetectMobile: {
            type: Boolean,
            default: true  
        },
        fullscreen: Boolean,
        fullscreenZIndex: {
            type: Number,
            default: 17
        },
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
        visibleOverlay: Boolean
    },
}
</script>
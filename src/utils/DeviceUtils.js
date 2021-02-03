export default class DeviceUtils {
    static isTouchScreen() {
        var touchDevice = (navigator.maxTouchPoints > 0 || 'ontouchstart' in document.documentElement);
        return touchDevice;
    }
}
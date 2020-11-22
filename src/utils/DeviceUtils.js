export default class DeviceUtils {
    static isTouchScreen() {
        var touchDevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);
        return touchDevice;
    }
}
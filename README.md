# Easy Vue Camera

This vue component is powered by <a href="https://github.com/farhadnowzari/easy-js-camera">easy-js-camera</a> library.

## Installation
The package is available via npm.
```
npm install easy-vue-camera
```
After the installation is complete with the following code you can add the component.
```
import EasyCamera from 'easy-vue-camera';

Vue.use(EasyCamera);
```
or
```
import EasyCamera from 'easy-vue-camera';

//inside your vue options api
export default {
    components: {
        ...
        'v-easy-camera': EasyCamera
        ...
    }
}
```
## Usage
After adding the EasyCamera component to your vue components you can use it like below.
```
<v-easy-camera
    v-model="picture"></v-easy-camera>
```

### Properties
* **autoDetectMobile:** This property will let the component to decide if it is loading on a touch screen device or not. `default: true`
* **defaultMobileActions:** This option will let you have the build in controls of the component to take a picture and retake or switch the camera. **Node** that this option only appears in fullscreen mode. `default: false`
* **fullscreen:** This option will make the component fullscreen. `default: false`
* **mustApprove:** Setting this option to true will make the component no to immediately send back the tooken picture to your v-model and will show a confirmation button first. `default: false`
* **output:** Here you can set the `output` image that you expect from the component. You can set this to `dataUrl` or `blob`. `default: dataUrl`
* **overlayMask:** This option will set an overlay mask on the video. You can have a grid so your user can see how you excpect the picture to be taken. It accepts string and the value is the path to your `mask image`.
* **startOnMounted:** The component will grant the persmission on mounted anyway but you can decide to run the camera on mounted or not by setting this property. `default: true`
### Functions
You can access the functions inside the component by referencing the component.

* **approve:** This function emits `input` and `approve` and both deliver the tooken picture.
* **close:** This function will stop the camera if any exists and will emit `close` event.
* **snap:** This function will take a picture and if the `mustApprove` property is not set then it will emit `input` and will send the picture back.
* **start:** This function will start the camera and emits `loading` event on beging and end of the function. *loading event has a value of true or false*
* **switchCamera:** This function will try to switch the camera if any other camera than the main one exists.


## Desktop version
Please note that on desktop just the video is adjusted and no `actions` are shown. On desktop it is better that the actions are placed manually than using the component actions. *The actions are available in fullscreen mode*
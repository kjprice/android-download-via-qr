This simple project allows you to download your android project directly to your android device by scanning a QR code. It is built to work with phonegap and cordova (Android) applications as well.

## Download
Download using [npm](https://www.npmjs.com/):
```
npm install android-download-via-qr
```

## Usage
The method accepts three parameters: `path_to_android_directory, options, callback`.

The following example runs Qr_Download and opens the qr code to download in your browser.

```js
var QR = require('android-download-via-qr');

QR('cordova/', {dontOpen:false}, function (err) {
  if (err) {
    console.log(err);
  }
});
```

It is really as simple as that!

To download it, scan the QR with a phone that is on the same network as your nodejs instance.

Also check out the grunt package for this project: https://github.com/kjprice/grunt-android-download-via-qr

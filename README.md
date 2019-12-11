# VUPLAY native hls fairplay

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Built with Grunt](http://cdn.gruntjs.com/builtwith.svg)](https://gruntjs.com/)

## Description

This repository will demonstrate how to use [VUDRM](https://vudrm.vualto.com/) with hls and fairplay in the [native video element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video).
If you have any questions please contact support@vualto.com

## Instructions

### Install dependencies

1. Install [npm](https://www.npmjs.com/)
2. Clone the repository: `git clone git@github.com:Vualto/vuplay-dashjs.git`
3. Navigate to the project's root folder: `cd vuplay-native-hls-fairplay`
4. Install the dependencies: `npm install`

### Build and run the dev environment

1. Open the repository in your favourite javascript editor.
2. In file `index.html` replace `<your-hls-stream-url>` with your stream URL.
3. In file `index.html` replace `<your-vudrm-token>` with a VUDRM token from [https://admin.drm.technology](https://admin.drm.technology)
4. Run `npm run build` in the project's root. This will create a `dist` folder that contains all the files needed to run this demo.
5. Load a supported browser and go to `https://localhost:14703`

NB: In order to allow DRM encrypted playback in safari, SSL has been enabled for the demo. You will get a warning about an invalid cert but this can safely be ignored and accept to visit the website.

### Browser support

The browser must support "com.apple.fps.1_0" as `WebKitMediaKeys`.
Currently this includes the latest versions of Safari.
For any question feel free to contact <support@vualto.com>

## Useful links

### VUDRM

-   [Contact vualto](https://www.vualto.com/contact-us/)
-   [VUDRM](https://vudrm.vualto.com/)
-   [VUDRM token documentation](https://docs.vualto.com/projects/vudrm/en/latest/VUDRM-token.html)

#############################

### HTMLVideoELement

-   [HTMLVideoElement in safari](https://developer.apple.com/documentation/webkitjs/htmlmediaelement)
-   [WebKitMediaKeys](https://developer.apple.com/documentation/webkitjs/webkitmediakeys)

### Build tools

-   [npm](https://www.npmjs.com/)
-   [grunt](https://gruntjs.com/)

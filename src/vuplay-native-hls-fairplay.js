/**
 *
 * VUDRMFairplayHLS is the exported function that is used to wire fairplay with the native video element.
 *
 * @param {*} config - vudrmConfiguration that must follow this structure: {
                drmToken: <vudrmToken>,
                drmKeySystem: "com.apple.fps.1_0",
                drmCertUrl: "https://fairplay-license.vudrm.tech/certificate",
                laUrl: "https://fairplay-license.vudrm.tech/license",
            }
 * @param {HTMLVideoElement} videoElement - native video element
 * @param {function} certLoadedCallback - The callback executed once everything is done.
 */
function VUDRMFairplayHLS(config, videoElement, certLoadedCallback) {
    var keySessions = [];
    if (!DRMUtils.isFairPlaySupported(videoElement, config.drmKeySystem)) {
        console.error("[VUPLAY] > Fairplay not supported!");
        return;
    }
    var certificateRequest = createCertificateRequest(config);
    certificateRequest.onload = CreateCertificateLoadedListener(
        videoElement,
        certificateRequest,
        certLoadedCallback,
        keySessions,
        config
    );
    certificateRequest.send();
}

/* implementaion helpers */
function createCertificateRequest(config) {
    var loadCertificateRequest = new XMLHttpRequest();
    loadCertificateRequest.responseType = "arraybuffer";
    loadCertificateRequest.timeout = 10000;
    loadCertificateRequest.open("GET", config.drmCertUrl, true);
    loadCertificateRequest.setRequestHeader("x-vudrm-token", config.drmToken);
    loadCertificateRequest.onerror = console.error.bind(console);
    loadCertificateRequest.ontimeout = console.error.bind(console);
    return loadCertificateRequest;
}
function CreateCertificateLoadedListener(
    videoElement,
    loadCertificateRequest,
    certLoadedCallback,
    keySessions,
    config
) {
    return function onCertificateLoaded() {
        if (loadCertificateRequest.status > 299) {
            console.error(
                "[VUPLAY] > Error: _onCertificateLoaded",
                loadCertificateRequest.status
            );
            return;
        }
        var response = loadCertificateRequest.response;
        var certificate = new Uint8Array(response);
        var needKeyEventListener = createNeedKeyListener(
            config,
            videoElement,
            certificate,
            keySessions
        );
        videoElement.addEventListener(
            "webkitneedkey",
            needKeyEventListener,
            false
        );
        certLoadedCallback.call();
    };
}
function createNeedKeyListener(config, videoElement, certificate, keySessions) {
    return function createAndStoreNewKeySession(event) {
        var keySession = createKeySession(
            config,
            videoElement,
            event.initData,
            certificate
        );
        keySessions.push(keySession);
    };
}
var Utils = {
    uint16ArrayToString: function(array) {
        var uint16Array = new Uint16Array(array.buffer);
        return String.fromCharCode.apply(String, uint16Array);
    },
    stringToUint16Array: function(string) {
        var buffer = new ArrayBuffer(string.length * 2); // 2 bytes for each char
        var array = new Uint16Array(buffer);
        for (var i = 0, strLen = string.length; i < strLen; i++) {
            array[i] = string.charCodeAt(i);
        }
        return array;
    },
    base64EncodeUint8Array: function(input) {
        var keyStr =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        while (i < input.length) {
            chr1 = input[i++];
            chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
            chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output +=
                keyStr.charAt(enc1) +
                keyStr.charAt(enc2) +
                keyStr.charAt(enc3) +
                keyStr.charAt(enc4);
        }
        return output;
    },
    base64DecodeUint8Array: function(input) {
        var raw = window.atob(input);
        var rawLength = raw.length;
        var array = new Uint8Array(new ArrayBuffer(rawLength));
        for (var i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array;
    },
};
var DRMUtils = {
    extractContentId: function(initData) {
        var laurlAsArray = Utils.uint16ArrayToString(initData).split("/");
        return laurlAsArray[laurlAsArray.length - 1];
    },
    concatInitDataContentIdAndCert: function(initData, contentId, cert) {
        contentId = Utils.stringToUint16Array(contentId);
        var offset = 0;
        var buffer = new ArrayBuffer(
            initData.byteLength + 4 + contentId.byteLength + 4 + cert.byteLength
        );
        var dataView = new DataView(buffer);
        var initDataArray = new Uint8Array(buffer, offset, initData.byteLength);
        initDataArray.set(initData);
        offset += initData.byteLength;
        dataView.setUint32(offset, contentId.byteLength, true);
        offset += 4;
        var contentIdArray = new Uint8Array(
            buffer,
            offset,
            contentId.byteLength
        );
        contentIdArray.set(contentId);
        offset += contentIdArray.byteLength;
        dataView.setUint32(offset, cert.byteLength, true);
        offset += 4;
        var certArray = new Uint8Array(buffer, offset, cert.byteLength);
        certArray.set(cert);
        return new Uint8Array(buffer, 0, buffer.byteLength);
    },
    isFairPlaySupported: function(videoElement, keySystem) {
        return (
            typeof videoElement.webkitKeys != "undefined" &&
            typeof videoElement.webkitSetMediaKeys != "undefined" &&
            typeof WebKitMediaKeys != "undefined" &&
            WebKitMediaKeys.isTypeSupported(keySystem, "video/mp4")
        );
    },
};
function createKeySession(config, videoElement, initData, certificate) {
    var contentId = DRMUtils.extractContentId(initData);
    var sessionData = DRMUtils.concatInitDataContentIdAndCert(
        initData,
        contentId,
        certificate
    );
    var mediaKeys = new WebKitMediaKeys(config.drmKeySystem);
    // @ts-ignore
    videoElement.webkitSetMediaKeys(mediaKeys);
    return setKeySession(contentId, sessionData, config, videoElement);
}
function setKeySession(contentId, sessionData, config, videoElement) {
    var keySession = videoElement.webkitKeys.createSession(
        "video/mp4",
        sessionData
    );
    if (!keySession) {
        return;
    }
    keySession.contentId = contentId;
    addKeySessionListeners(keySession, contentId, config);
    return keySession;
}
function addKeySessionListeners(keySession, contentId, config) {
    keySession.addEventListener(
        "webkitkeymessage",
        createKeyMessageListener(contentId, config, keySession),
        false
    );
    keySession.addEventListener(
        "webkitkeyadded",
        console.log.bind(console),
        false
    );
    keySession.addEventListener(
        "webkitkeyerror",
        console.error.bind(console),
        false
    );
}
function createKeyMessageListener(contentId, config, keySession) {
    return function onKeyMessage(event) {
        var body = {
            token: config.drmToken,
            contentId: contentId,
            payload: Utils.base64EncodeUint8Array(event.message),
        };
        var jsonBody = JSON.stringify(body);
        var loadLicenseRequest = createLoadLicenseRequest(config);
        loadLicenseRequest.onload = createLoadListener(
            loadLicenseRequest,
            keySession
        );
        loadLicenseRequest.send(jsonBody);
    };
}
function createLoadLicenseRequest(config) {
    var loadLicenseRequest = new XMLHttpRequest();
    loadLicenseRequest.responseType = "arraybuffer";
    loadLicenseRequest.timeout = 10000;
    loadLicenseRequest.open("POST", config.laUrl, true);
    loadLicenseRequest.setRequestHeader("Content-Type", "application/json");
    loadLicenseRequest.onerror = console.error.bind(console);
    loadLicenseRequest.ontimeout = console.error.bind(console);
    return loadLicenseRequest;
}
function createLoadListener(loadLicenseRequest, keySession) {
    return function onLicenseRequestLoaded(event) {
        if (loadLicenseRequest.status > 299) {
            return;
        }
        var license = new Uint8Array(loadLicenseRequest.response);
        keySession.update(license);
    };
}

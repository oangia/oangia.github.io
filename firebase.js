/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// This value is retrieved and hardcoded by the NPM postinstall script
const getDefaultsFromPostinstall = () => undefined;

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const stringToByteArray$1 = function (str) {
    // TODO(user): Use native implementations if/when available
    const out = [];
    let p = 0;
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 128) {
            out[p++] = c;
        }
        else if (c < 2048) {
            out[p++] = (c >> 6) | 192;
            out[p++] = (c & 63) | 128;
        }
        else if ((c & 0xfc00) === 0xd800 &&
            i + 1 < str.length &&
            (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
            // Surrogate Pair
            c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
            out[p++] = (c >> 18) | 240;
            out[p++] = ((c >> 12) & 63) | 128;
            out[p++] = ((c >> 6) & 63) | 128;
            out[p++] = (c & 63) | 128;
        }
        else {
            out[p++] = (c >> 12) | 224;
            out[p++] = ((c >> 6) & 63) | 128;
            out[p++] = (c & 63) | 128;
        }
    }
    return out;
};
/**
 * Turns an array of numbers into the string given by the concatenation of the
 * characters to which the numbers correspond.
 * @param bytes Array of numbers representing characters.
 * @return Stringification of the array.
 */
const byteArrayToString = function (bytes) {
    // TODO(user): Use native implementations if/when available
    const out = [];
    let pos = 0, c = 0;
    while (pos < bytes.length) {
        const c1 = bytes[pos++];
        if (c1 < 128) {
            out[c++] = String.fromCharCode(c1);
        }
        else if (c1 > 191 && c1 < 224) {
            const c2 = bytes[pos++];
            out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
        }
        else if (c1 > 239 && c1 < 365) {
            // Surrogate Pair
            const c2 = bytes[pos++];
            const c3 = bytes[pos++];
            const c4 = bytes[pos++];
            const u = (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
                0x10000;
            out[c++] = String.fromCharCode(0xd800 + (u >> 10));
            out[c++] = String.fromCharCode(0xdc00 + (u & 1023));
        }
        else {
            const c2 = bytes[pos++];
            const c3 = bytes[pos++];
            out[c++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        }
    }
    return out.join('');
};
// We define it as an object literal instead of a class because a class compiled down to es5 can't
// be treeshaked. https://github.com/rollup/rollup/issues/1691
// Static lookup maps, lazily populated by init_()
// TODO(dlarocque): Define this as a class, since we no longer target ES5.
const base64 = {
    /**
     * Maps bytes to characters.
     */
    byteToCharMap_: null,
    /**
     * Maps characters to bytes.
     */
    charToByteMap_: null,
    /**
     * Maps bytes to websafe characters.
     * @private
     */
    byteToCharMapWebSafe_: null,
    /**
     * Maps websafe characters to bytes.
     * @private
     */
    charToByteMapWebSafe_: null,
    /**
     * Our default alphabet, shared between
     * ENCODED_VALS and ENCODED_VALS_WEBSAFE
     */
    ENCODED_VALS_BASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789',
    /**
     * Our default alphabet. Value 64 (=) is special; it means "nothing."
     */
    get ENCODED_VALS() {
        return this.ENCODED_VALS_BASE + '+/=';
    },
    /**
     * Our websafe alphabet.
     */
    get ENCODED_VALS_WEBSAFE() {
        return this.ENCODED_VALS_BASE + '-_.';
    },
    /**
     * Whether this browser supports the atob and btoa functions. This extension
     * started at Mozilla but is now implemented by many browsers. We use the
     * ASSUME_* variables to avoid pulling in the full useragent detection library
     * but still allowing the standard per-browser compilations.
     *
     */
    HAS_NATIVE_SUPPORT: typeof atob === 'function',
    /**
     * Base64-encode an array of bytes.
     *
     * @param input An array of bytes (numbers with
     *     value in [0, 255]) to encode.
     * @param webSafe Boolean indicating we should use the
     *     alternative alphabet.
     * @return The base64 encoded string.
     */
    encodeByteArray(input, webSafe) {
        if (!Array.isArray(input)) {
            throw Error('encodeByteArray takes an array as a parameter');
        }
        this.init_();
        const byteToCharMap = webSafe
            ? this.byteToCharMapWebSafe_
            : this.byteToCharMap_;
        const output = [];
        for (let i = 0; i < input.length; i += 3) {
            const byte1 = input[i];
            const haveByte2 = i + 1 < input.length;
            const byte2 = haveByte2 ? input[i + 1] : 0;
            const haveByte3 = i + 2 < input.length;
            const byte3 = haveByte3 ? input[i + 2] : 0;
            const outByte1 = byte1 >> 2;
            const outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
            let outByte3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
            let outByte4 = byte3 & 0x3f;
            if (!haveByte3) {
                outByte4 = 64;
                if (!haveByte2) {
                    outByte3 = 64;
                }
            }
            output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
        }
        return output.join('');
    },
    /**
     * Base64-encode a string.
     *
     * @param input A string to encode.
     * @param webSafe If true, we should use the
     *     alternative alphabet.
     * @return The base64 encoded string.
     */
    encodeString(input, webSafe) {
        // Shortcut for Mozilla browsers that implement
        // a native base64 encoder in the form of "btoa/atob"
        if (this.HAS_NATIVE_SUPPORT && !webSafe) {
            return btoa(input);
        }
        return this.encodeByteArray(stringToByteArray$1(input), webSafe);
    },
    /**
     * Base64-decode a string.
     *
     * @param input to decode.
     * @param webSafe True if we should use the
     *     alternative alphabet.
     * @return string representing the decoded value.
     */
    decodeString(input, webSafe) {
        // Shortcut for Mozilla browsers that implement
        // a native base64 encoder in the form of "btoa/atob"
        if (this.HAS_NATIVE_SUPPORT && !webSafe) {
            return atob(input);
        }
        return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
    },
    /**
     * Base64-decode a string.
     *
     * In base-64 decoding, groups of four characters are converted into three
     * bytes.  If the encoder did not apply padding, the input length may not
     * be a multiple of 4.
     *
     * In this case, the last group will have fewer than 4 characters, and
     * padding will be inferred.  If the group has one or two characters, it decodes
     * to one byte.  If the group has three characters, it decodes to two bytes.
     *
     * @param input Input to decode.
     * @param webSafe True if we should use the web-safe alphabet.
     * @return bytes representing the decoded value.
     */
    decodeStringToByteArray(input, webSafe) {
        this.init_();
        const charToByteMap = webSafe
            ? this.charToByteMapWebSafe_
            : this.charToByteMap_;
        const output = [];
        for (let i = 0; i < input.length;) {
            const byte1 = charToByteMap[input.charAt(i++)];
            const haveByte2 = i < input.length;
            const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
            ++i;
            const haveByte3 = i < input.length;
            const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
            ++i;
            const haveByte4 = i < input.length;
            const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
            ++i;
            if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
                throw new DecodeBase64StringError();
            }
            const outByte1 = (byte1 << 2) | (byte2 >> 4);
            output.push(outByte1);
            if (byte3 !== 64) {
                const outByte2 = ((byte2 << 4) & 0xf0) | (byte3 >> 2);
                output.push(outByte2);
                if (byte4 !== 64) {
                    const outByte3 = ((byte3 << 6) & 0xc0) | byte4;
                    output.push(outByte3);
                }
            }
        }
        return output;
    },
    /**
     * Lazy static initialization function. Called before
     * accessing any of the static map variables.
     * @private
     */
    init_() {
        if (!this.byteToCharMap_) {
            this.byteToCharMap_ = {};
            this.charToByteMap_ = {};
            this.byteToCharMapWebSafe_ = {};
            this.charToByteMapWebSafe_ = {};
            // We want quick mappings back and forth, so we precompute two maps.
            for (let i = 0; i < this.ENCODED_VALS.length; i++) {
                this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
                this.charToByteMap_[this.byteToCharMap_[i]] = i;
                this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
                this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
                // Be forgiving when decoding and correctly decode both encodings.
                if (i >= this.ENCODED_VALS_BASE.length) {
                    this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
                    this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
                }
            }
        }
    }
};
/**
 * An error encountered while decoding base64 string.
 */
class DecodeBase64StringError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'DecodeBase64StringError';
    }
}
/**
 * URL-safe base64 encoding
 */
const base64Encode = function (str) {
    const utf8Bytes = stringToByteArray$1(str);
    return base64.encodeByteArray(utf8Bytes, true);
};
/**
 * URL-safe base64 encoding (without "." padding in the end).
 * e.g. Used in JSON Web Token (JWT) parts.
 */
const base64urlEncodeWithoutPadding = function (str) {
    // Use base64url encoding and remove padding in the end (dot characters).
    return base64Encode(str).replace(/\./g, '');
};
/**
 * URL-safe base64 decoding
 *
 * NOTE: DO NOT use the global atob() function - it does NOT support the
 * base64Url variant encoding.
 *
 * @param str To be decoded
 * @return Decoded result, if possible
 */
const base64Decode = function (str) {
    try {
        return base64.decodeString(str, true);
    }
    catch (e) {
        console.error('base64Decode failed: ', e);
    }
    return null;
};
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Polyfill for `globalThis` object.
 * @returns the `globalThis` object for the given environment.
 * @public
 */
function getGlobal() {
    if (typeof self !== 'undefined') {
        return self;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    if (typeof global !== 'undefined') {
        return global;
    }
    throw new Error('Unable to locate global object.');
}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
/**
 * Attempt to read defaults from a JSON string provided to
 * process(.)env(.)__FIREBASE_DEFAULTS__ or a JSON file whose path is in
 * process(.)env(.)__FIREBASE_DEFAULTS_PATH__
 * The dots are in parens because certain compilers (Vite?) cannot
 * handle seeing that variable in comments.
 * See https://github.com/firebase/firebase-js-sdk/issues/6838
 */
const getDefaultsFromEnvVariable = () => {
    if (typeof process === 'undefined' || typeof process.env === 'undefined') {
        return;
    }
    const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
    if (defaultsJsonString) {
        return JSON.parse(defaultsJsonString);
    }
};
const getDefaultsFromCookie = () => {
    if (typeof document === 'undefined') {
        return;
    }
    let match;
    try {
        match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
    }
    catch (e) {
        // Some environments such as Angular Universal SSR have a
        // `document` object but error on accessing `document.cookie`.
        return;
    }
    const decoded = match && base64Decode(match[1]);
    return decoded && JSON.parse(decoded);
};
/**
 * Get the __FIREBASE_DEFAULTS__ object. It checks in order:
 * (1) if such an object exists as a property of `globalThis`
 * (2) if such an object was provided on a shell environment variable
 * (3) if such an object exists in a cookie
 * @public
 */
const getDefaults = () => {
    try {
        return (getDefaultsFromPostinstall() ||
            getDefaultsFromGlobal() ||
            getDefaultsFromEnvVariable() ||
            getDefaultsFromCookie());
    }
    catch (e) {
        /**
         * Catch-all for being unable to get __FIREBASE_DEFAULTS__ due
         * to any environment case we have not accounted for. Log to
         * info instead of swallowing so we can find these unknown cases
         * and add paths for them if needed.
         */
        console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
        return;
    }
};
/**
 * Returns Firebase app config stored in the __FIREBASE_DEFAULTS__ object.
 * @public
 */
const getDefaultAppConfig = () => getDefaults()?.config;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Deferred {
    constructor() {
        this.reject = () => { };
        this.resolve = () => { };
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    /**
     * Our API internals are not promisified and cannot because our callback APIs have subtle expectations around
     * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
     * and returns a node-style callback which will resolve or reject the Deferred's promise.
     */
    wrapCallback(callback) {
        return (error, value) => {
            if (error) {
                this.reject(error);
            }
            else {
                this.resolve(value);
            }
            if (typeof callback === 'function') {
                // Attaching noop handler just in case developer wasn't expecting
                // promises
                this.promise.catch(() => { });
                // Some of our callbacks don't expect a value and our own tests
                // assert that the parameter length is 1
                if (callback.length === 1) {
                    callback(error);
                }
                else {
                    callback(error, value);
                }
            }
        };
    }
}
/**
 * Detect Browser Environment.
 * Note: This will return true for certain test frameworks that are incompletely
 * mimicking a browser, and should not lead to assuming all browser APIs are
 * available.
 */
function isBrowser() {
    return typeof window !== 'undefined' || isWebWorker();
}
/**
 * Detect Web Worker context.
 */
function isWebWorker() {
    return (typeof WorkerGlobalScope !== 'undefined' &&
        typeof self !== 'undefined' &&
        self instanceof WorkerGlobalScope);
}
/**
 * This method checks if indexedDB is supported by current browser/service worker context
 * @return true if indexedDB is supported by current browser/service worker context
 */
function isIndexedDBAvailable() {
    try {
        return typeof indexedDB === 'object';
    }
    catch (e) {
        return false;
    }
}
/**
 * This method validates browser/sw context for indexedDB by opening a dummy indexedDB database and reject
 * if errors occur during the database open operation.
 *
 * @throws exception if current browser/sw context can't run idb.open (ex: Safari iframe, Firefox
 * private browsing)
 */
function validateIndexedDBOpenable() {
    return new Promise((resolve, reject) => {
        try {
            let preExist = true;
            const DB_CHECK_NAME = 'validate-browser-context-for-indexeddb-analytics-module';
            const request = self.indexedDB.open(DB_CHECK_NAME);
            request.onsuccess = () => {
                request.result.close();
                // delete database only when it doesn't pre-exist
                if (!preExist) {
                    self.indexedDB.deleteDatabase(DB_CHECK_NAME);
                }
                resolve(true);
            };
            request.onupgradeneeded = () => {
                preExist = false;
            };
            request.onerror = () => {
                reject(request.error?.message || '');
            };
        }
        catch (error) {
            reject(error);
        }
    });
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview Standardized Firebase Error.
 *
 * Usage:
 *
 *   // TypeScript string literals for type-safe codes
 *   type Err =
 *     'unknown' |
 *     'object-not-found'
 *     ;
 *
 *   // Closure enum for type-safe error codes
 *   // at-enum {string}
 *   var Err = {
 *     UNKNOWN: 'unknown',
 *     OBJECT_NOT_FOUND: 'object-not-found',
 *   }
 *
 *   let errors: Map<Err, string> = {
 *     'generic-error': "Unknown error",
 *     'file-not-found': "Could not find file: {$file}",
 *   };
 *
 *   // Type-safe function - must pass a valid error code as param.
 *   let error = new ErrorFactory<Err>('service', 'Service', errors);
 *
 *   ...
 *   throw error.create(Err.GENERIC);
 *   ...
 *   throw error.create(Err.FILE_NOT_FOUND, {'file': fileName});
 *   ...
 *   // Service: Could not file file: foo.txt (service/file-not-found).
 *
 *   catch (e) {
 *     assert(e.message === "Could not find file: foo.txt.");
 *     if ((e as FirebaseError)?.code === 'service/file-not-found') {
 *       console.log("Could not read file: " + e['file']);
 *     }
 *   }
 */
const ERROR_NAME = 'FirebaseError';
// Based on code from:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types
class FirebaseError extends Error {
    constructor(
    /** The error code for this error. */
    code, message, 
    /** Custom data for this error. */
    customData) {
        super(message);
        this.code = code;
        this.customData = customData;
        /** The custom name for all FirebaseErrors. */
        this.name = ERROR_NAME;
        // Fix For ES5
        // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        // TODO(dlarocque): Replace this with `new.target`: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
        //                   which we can now use since we no longer target ES5.
        Object.setPrototypeOf(this, FirebaseError.prototype);
        // Maintains proper stack trace for where our error was thrown.
        // Only available on V8.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ErrorFactory.prototype.create);
        }
    }
}
class ErrorFactory {
    constructor(service, serviceName, errors) {
        this.service = service;
        this.serviceName = serviceName;
        this.errors = errors;
    }
    create(code, ...data) {
        const customData = data[0] || {};
        const fullCode = `${this.service}/${code}`;
        const template = this.errors[code];
        const message = template ? replaceTemplate(template, customData) : 'Error';
        // Service Name: Error message (service/code).
        const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
        const error = new FirebaseError(fullCode, fullMessage, customData);
        return error;
    }
}
function replaceTemplate(template, data) {
    return template.replace(PATTERN, (_, key) => {
        const value = data[key];
        return value != null ? String(value) : `<${key}?>`;
    });
}
const PATTERN = /\{\$([^}]+)}/g;
/**
 * Deep equal two objects. Support Arrays and Objects.
 */
function deepEqual(a, b) {
    if (a === b) {
        return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    for (const k of aKeys) {
        if (!bKeys.includes(k)) {
            return false;
        }
        const aProp = a[k];
        const bProp = b[k];
        if (isObject(aProp) && isObject(bProp)) {
            if (!deepEqual(aProp, bProp)) {
                return false;
            }
        }
        else if (aProp !== bProp) {
            return false;
        }
    }
    for (const k of bKeys) {
        if (!aKeys.includes(k)) {
            return false;
        }
    }
    return true;
}
function isObject(thing) {
    return thing !== null && typeof thing === 'object';
}

/**
 * Component for service name T, e.g. `auth`, `auth-internal`
 */
class Component {
    /**
     *
     * @param name The public service name, e.g. app, auth, firestore, database
     * @param instanceFactory Service factory responsible for creating the public interface
     * @param type whether the service provided by the component is public or private
     */
    constructor(name, instanceFactory, type) {
        this.name = name;
        this.instanceFactory = instanceFactory;
        this.type = type;
        this.multipleInstances = false;
        /**
         * Properties to be added to the service namespace
         */
        this.serviceProps = {};
        this.instantiationMode = "LAZY" /* InstantiationMode.LAZY */;
        this.onInstanceCreated = null;
    }
    setInstantiationMode(mode) {
        this.instantiationMode = mode;
        return this;
    }
    setMultipleInstances(multipleInstances) {
        this.multipleInstances = multipleInstances;
        return this;
    }
    setServiceProps(props) {
        this.serviceProps = props;
        return this;
    }
    setInstanceCreatedCallback(callback) {
        this.onInstanceCreated = callback;
        return this;
    }
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DEFAULT_ENTRY_NAME$1 = '[DEFAULT]';
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Provider for instance for service name T, e.g. 'auth', 'auth-internal'
 * NameServiceMapping[T] is an alias for the type of the instance
 */
class Provider {
    constructor(name, container) {
        this.name = name;
        this.container = container;
        this.component = null;
        this.instances = new Map();
        this.instancesDeferred = new Map();
        this.instancesOptions = new Map();
        this.onInitCallbacks = new Map();
    }
    /**
     * @param identifier A provider can provide multiple instances of a service
     * if this.component.multipleInstances is true.
     */
    get(identifier) {
        // if multipleInstances is not supported, use the default name
        const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
        if (!this.instancesDeferred.has(normalizedIdentifier)) {
            const deferred = new Deferred();
            this.instancesDeferred.set(normalizedIdentifier, deferred);
            if (this.isInitialized(normalizedIdentifier) ||
                this.shouldAutoInitialize()) {
                // initialize the service if it can be auto-initialized
                try {
                    const instance = this.getOrInitializeService({
                        instanceIdentifier: normalizedIdentifier
                    });
                    if (instance) {
                        deferred.resolve(instance);
                    }
                }
                catch (e) {
                    // when the instance factory throws an exception during get(), it should not cause
                    // a fatal error. We just return the unresolved promise in this case.
                }
            }
        }
        return this.instancesDeferred.get(normalizedIdentifier).promise;
    }
    getImmediate(options) {
        // if multipleInstances is not supported, use the default name
        const normalizedIdentifier = this.normalizeInstanceIdentifier(options?.identifier);
        const optional = options?.optional ?? false;
        if (this.isInitialized(normalizedIdentifier) ||
            this.shouldAutoInitialize()) {
            try {
                return this.getOrInitializeService({
                    instanceIdentifier: normalizedIdentifier
                });
            }
            catch (e) {
                if (optional) {
                    return null;
                }
                else {
                    throw e;
                }
            }
        }
        else {
            // In case a component is not initialized and should/cannot be auto-initialized at the moment, return null if the optional flag is set, or throw
            if (optional) {
                return null;
            }
            else {
                throw Error(`Service ${this.name} is not available`);
            }
        }
    }
    getComponent() {
        return this.component;
    }
    setComponent(component) {
        if (component.name !== this.name) {
            throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
        }
        if (this.component) {
            throw Error(`Component for ${this.name} has already been provided`);
        }
        this.component = component;
        // return early without attempting to initialize the component if the component requires explicit initialization (calling `Provider.initialize()`)
        if (!this.shouldAutoInitialize()) {
            return;
        }
        // if the service is eager, initialize the default instance
        if (isComponentEager(component)) {
            try {
                this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME$1 });
            }
            catch (e) {
                // when the instance factory for an eager Component throws an exception during the eager
                // initialization, it should not cause a fatal error.
                // TODO: Investigate if we need to make it configurable, because some component may want to cause
                // a fatal error in this case?
            }
        }
        // Create service instances for the pending promises and resolve them
        // NOTE: if this.multipleInstances is false, only the default instance will be created
        // and all promises with resolve with it regardless of the identifier.
        for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
            const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
            try {
                // `getOrInitializeService()` should always return a valid instance since a component is guaranteed. use ! to make typescript happy.
                const instance = this.getOrInitializeService({
                    instanceIdentifier: normalizedIdentifier
                });
                instanceDeferred.resolve(instance);
            }
            catch (e) {
                // when the instance factory throws an exception, it should not cause
                // a fatal error. We just leave the promise unresolved.
            }
        }
    }
    clearInstance(identifier = DEFAULT_ENTRY_NAME$1) {
        this.instancesDeferred.delete(identifier);
        this.instancesOptions.delete(identifier);
        this.instances.delete(identifier);
    }
    // app.delete() will call this method on every provider to delete the services
    // TODO: should we mark the provider as deleted?
    async delete() {
        const services = Array.from(this.instances.values());
        await Promise.all([
            ...services
                .filter(service => 'INTERNAL' in service) // legacy services
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map(service => service.INTERNAL.delete()),
            ...services
                .filter(service => '_delete' in service) // modularized services
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map(service => service._delete())
        ]);
    }
    isComponentSet() {
        return this.component != null;
    }
    isInitialized(identifier = DEFAULT_ENTRY_NAME$1) {
        return this.instances.has(identifier);
    }
    getOptions(identifier = DEFAULT_ENTRY_NAME$1) {
        return this.instancesOptions.get(identifier) || {};
    }
    initialize(opts = {}) {
        const { options = {} } = opts;
        const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
        if (this.isInitialized(normalizedIdentifier)) {
            throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
        }
        if (!this.isComponentSet()) {
            throw Error(`Component ${this.name} has not been registered yet`);
        }
        const instance = this.getOrInitializeService({
            instanceIdentifier: normalizedIdentifier,
            options
        });
        // resolve any pending promise waiting for the service instance
        for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
            const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
            if (normalizedIdentifier === normalizedDeferredIdentifier) {
                instanceDeferred.resolve(instance);
            }
        }
        return instance;
    }
    /**
     *
     * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
     * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
     *
     * @param identifier An optional instance identifier
     * @returns a function to unregister the callback
     */
    onInit(callback, identifier) {
        const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
        const existingCallbacks = this.onInitCallbacks.get(normalizedIdentifier) ??
            new Set();
        existingCallbacks.add(callback);
        this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
        const existingInstance = this.instances.get(normalizedIdentifier);
        if (existingInstance) {
            callback(existingInstance, normalizedIdentifier);
        }
        return () => {
            existingCallbacks.delete(callback);
        };
    }
    /**
     * Invoke onInit callbacks synchronously
     * @param instance the service instance`
     */
    invokeOnInitCallbacks(instance, identifier) {
        const callbacks = this.onInitCallbacks.get(identifier);
        if (!callbacks) {
            return;
        }
        for (const callback of callbacks) {
            try {
                callback(instance, identifier);
            }
            catch {
                // ignore errors in the onInit callback
            }
        }
    }
    getOrInitializeService({ instanceIdentifier, options = {} }) {
        let instance = this.instances.get(instanceIdentifier);
        if (!instance && this.component) {
            instance = this.component.instanceFactory(this.container, {
                instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
                options
            });
            this.instances.set(instanceIdentifier, instance);
            this.instancesOptions.set(instanceIdentifier, options);
            /**
             * Invoke onInit listeners.
             * Note this.component.onInstanceCreated is different, which is used by the component creator,
             * while onInit listeners are registered by consumers of the provider.
             */
            this.invokeOnInitCallbacks(instance, instanceIdentifier);
            /**
             * Order is important
             * onInstanceCreated() should be called after this.instances.set(instanceIdentifier, instance); which
             * makes `isInitialized()` return true.
             */
            if (this.component.onInstanceCreated) {
                try {
                    this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
                }
                catch {
                    // ignore errors in the onInstanceCreatedCallback
                }
            }
        }
        return instance || null;
    }
    normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME$1) {
        if (this.component) {
            return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME$1;
        }
        else {
            return identifier; // assume multiple instances are supported before the component is provided.
        }
    }
    shouldAutoInitialize() {
        return (!!this.component &&
            this.component.instantiationMode !== "EXPLICIT" /* InstantiationMode.EXPLICIT */);
    }
}
// undefined should be passed to the service factory for the default instance
function normalizeIdentifierForFactory(identifier) {
    return identifier === DEFAULT_ENTRY_NAME$1 ? undefined : identifier;
}
function isComponentEager(component) {
    return component.instantiationMode === "EAGER" /* InstantiationMode.EAGER */;
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * ComponentContainer that provides Providers for service name T, e.g. `auth`, `auth-internal`
 */
class ComponentContainer {
    constructor(name) {
        this.name = name;
        this.providers = new Map();
    }
    /**
     *
     * @param component Component being added
     * @param overwrite When a component with the same name has already been registered,
     * if overwrite is true: overwrite the existing component with the new component and create a new
     * provider with the new component. It can be useful in tests where you want to use different mocks
     * for different tests.
     * if overwrite is false: throw an exception
     */
    addComponent(component) {
        const provider = this.getProvider(component.name);
        if (provider.isComponentSet()) {
            throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
        }
        provider.setComponent(component);
    }
    addOrOverwriteComponent(component) {
        const provider = this.getProvider(component.name);
        if (provider.isComponentSet()) {
            // delete the existing provider from the container, so we can register the new component
            this.providers.delete(component.name);
        }
        this.addComponent(component);
    }
    /**
     * getProvider provides a type safe interface where it can only be called with a field name
     * present in NameServiceMapping interface.
     *
     * Firebase SDKs providing services should extend NameServiceMapping interface to register
     * themselves.
     */
    getProvider(name) {
        if (this.providers.has(name)) {
            return this.providers.get(name);
        }
        // create a Provider for a service that hasn't registered with Firebase
        const provider = new Provider(name, this);
        this.providers.set(name, provider);
        return provider;
    }
    getProviders() {
        return Array.from(this.providers.values());
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A container for all of the Logger instances
 */
const instances = [];
/**
 * The JS SDK supports 5 log levels and also allows a user the ability to
 * silence the logs altogether.
 *
 * The order is a follows:
 * DEBUG < VERBOSE < INFO < WARN < ERROR
 *
 * All of the log types above the current log level will be captured (i.e. if
 * you set the log level to `INFO`, errors will still be logged, but `DEBUG` and
 * `VERBOSE` logs will not)
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["VERBOSE"] = 1] = "VERBOSE";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    LogLevel[LogLevel["SILENT"] = 5] = "SILENT";
})(LogLevel || (LogLevel = {}));
const levelStringToEnum = {
    'debug': LogLevel.DEBUG,
    'verbose': LogLevel.VERBOSE,
    'info': LogLevel.INFO,
    'warn': LogLevel.WARN,
    'error': LogLevel.ERROR,
    'silent': LogLevel.SILENT
};
/**
 * The default log level
 */
const defaultLogLevel = LogLevel.INFO;
/**
 * By default, `console.debug` is not displayed in the developer console (in
 * chrome). To avoid forcing users to have to opt-in to these logs twice
 * (i.e. once for firebase, and once in the console), we are sending `DEBUG`
 * logs to the `console.log` function.
 */
const ConsoleMethod = {
    [LogLevel.DEBUG]: 'log',
    [LogLevel.VERBOSE]: 'log',
    [LogLevel.INFO]: 'info',
    [LogLevel.WARN]: 'warn',
    [LogLevel.ERROR]: 'error'
};
/**
 * The default log handler will forward DEBUG, VERBOSE, INFO, WARN, and ERROR
 * messages on to their corresponding console counterparts (if the log method
 * is supported by the current log level)
 */
const defaultLogHandler = (instance, logType, ...args) => {
    if (logType < instance.logLevel) {
        return;
    }
    const now = new Date().toISOString();
    const method = ConsoleMethod[logType];
    if (method) {
        console[method](`[${now}]  ${instance.name}:`, ...args);
    }
    else {
        throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
    }
};
class Logger {
    /**
     * Gives you an instance of a Logger to capture messages according to
     * Firebase's logging scheme.
     *
     * @param name The name that the logs will be associated with
     */
    constructor(name) {
        this.name = name;
        /**
         * The log level of the given Logger instance.
         */
        this._logLevel = defaultLogLevel;
        /**
         * The main (internal) log handler for the Logger instance.
         * Can be set to a new function in internal package code but not by user.
         */
        this._logHandler = defaultLogHandler;
        /**
         * The optional, additional, user-defined log handler for the Logger instance.
         */
        this._userLogHandler = null;
        /**
         * Capture the current instance for later use
         */
        instances.push(this);
    }
    get logLevel() {
        return this._logLevel;
    }
    set logLevel(val) {
        if (!(val in LogLevel)) {
            throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
        }
        this._logLevel = val;
    }
    // Workaround for setter/getter having to be the same type.
    setLogLevel(val) {
        this._logLevel = typeof val === 'string' ? levelStringToEnum[val] : val;
    }
    get logHandler() {
        return this._logHandler;
    }
    set logHandler(val) {
        if (typeof val !== 'function') {
            throw new TypeError('Value assigned to `logHandler` must be a function');
        }
        this._logHandler = val;
    }
    get userLogHandler() {
        return this._userLogHandler;
    }
    set userLogHandler(val) {
        this._userLogHandler = val;
    }
    /**
     * The functions below are all based on the `console` interface
     */
    debug(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
        this._logHandler(this, LogLevel.DEBUG, ...args);
    }
    log(...args) {
        this._userLogHandler &&
            this._userLogHandler(this, LogLevel.VERBOSE, ...args);
        this._logHandler(this, LogLevel.VERBOSE, ...args);
    }
    info(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
        this._logHandler(this, LogLevel.INFO, ...args);
    }
    warn(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
        this._logHandler(this, LogLevel.WARN, ...args);
    }
    error(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
        this._logHandler(this, LogLevel.ERROR, ...args);
    }
}
function setLogLevel$1(level) {
    instances.forEach(inst => {
        inst.setLogLevel(level);
    });
}
function setUserLogHandler(logCallback, options) {
    for (const instance of instances) {
        let customLogLevel = null;
        if (options && options.level) {
            customLogLevel = levelStringToEnum[options.level];
        }
        if (logCallback === null) {
            instance.userLogHandler = null;
        }
        else {
            instance.userLogHandler = (instance, level, ...args) => {
                const message = args
                    .map(arg => {
                    if (arg == null) {
                        return null;
                    }
                    else if (typeof arg === 'string') {
                        return arg;
                    }
                    else if (typeof arg === 'number' || typeof arg === 'boolean') {
                        return arg.toString();
                    }
                    else if (arg instanceof Error) {
                        return arg.message;
                    }
                    else {
                        try {
                            return JSON.stringify(arg);
                        }
                        catch (ignored) {
                            return null;
                        }
                    }
                })
                    .filter(arg => arg)
                    .join(' ');
                if (level >= (customLogLevel ?? instance.logLevel)) {
                    logCallback({
                        level: LogLevel[level].toLowerCase(),
                        message,
                        args,
                        type: instance.name
                    });
                }
            };
        }
    }
}

const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
    return (idbProxyableTypes ||
        (idbProxyableTypes = [
            IDBDatabase,
            IDBObjectStore,
            IDBIndex,
            IDBCursor,
            IDBTransaction,
        ]));
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
    return (cursorAdvanceMethods ||
        (cursorAdvanceMethods = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
        ]));
}
const cursorRequestMap = new WeakMap();
const transactionDoneMap = new WeakMap();
const transactionStoreNamesMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
        const unlisten = () => {
            request.removeEventListener('success', success);
            request.removeEventListener('error', error);
        };
        const success = () => {
            resolve(wrap(request.result));
            unlisten();
        };
        const error = () => {
            reject(request.error);
            unlisten();
        };
        request.addEventListener('success', success);
        request.addEventListener('error', error);
    });
    promise
        .then((value) => {
        // Since cursoring reuses the IDBRequest (*sigh*), we cache it for later retrieval
        // (see wrapFunction).
        if (value instanceof IDBCursor) {
            cursorRequestMap.set(value, request);
        }
        // Catching to avoid "Uncaught Promise exceptions"
    })
        .catch(() => { });
    // This mapping exists in reverseTransformCache but doesn't doesn't exist in transformCache. This
    // is because we create many promises from a single IDBRequest.
    reverseTransformCache.set(promise, request);
    return promise;
}
function cacheDonePromiseForTransaction(tx) {
    // Early bail if we've already created a done promise for this transaction.
    if (transactionDoneMap.has(tx))
        return;
    const done = new Promise((resolve, reject) => {
        const unlisten = () => {
            tx.removeEventListener('complete', complete);
            tx.removeEventListener('error', error);
            tx.removeEventListener('abort', error);
        };
        const complete = () => {
            resolve();
            unlisten();
        };
        const error = () => {
            reject(tx.error || new DOMException('AbortError', 'AbortError'));
            unlisten();
        };
        tx.addEventListener('complete', complete);
        tx.addEventListener('error', error);
        tx.addEventListener('abort', error);
    });
    // Cache it for later retrieval.
    transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
    get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
            // Special handling for transaction.done.
            if (prop === 'done')
                return transactionDoneMap.get(target);
            // Polyfill for objectStoreNames because of Edge.
            if (prop === 'objectStoreNames') {
                return target.objectStoreNames || transactionStoreNamesMap.get(target);
            }
            // Make tx.store return the only store in the transaction, or undefined if there are many.
            if (prop === 'store') {
                return receiver.objectStoreNames[1]
                    ? undefined
                    : receiver.objectStore(receiver.objectStoreNames[0]);
            }
        }
        // Else transform whatever we get back.
        return wrap(target[prop]);
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    },
    has(target, prop) {
        if (target instanceof IDBTransaction &&
            (prop === 'done' || prop === 'store')) {
            return true;
        }
        return prop in target;
    },
};
function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
    // Due to expected object equality (which is enforced by the caching in `wrap`), we
    // only create one new func per func.
    // Edge doesn't support objectStoreNames (booo), so we polyfill it here.
    if (func === IDBDatabase.prototype.transaction &&
        !('objectStoreNames' in IDBTransaction.prototype)) {
        return function (storeNames, ...args) {
            const tx = func.call(unwrap(this), storeNames, ...args);
            transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
            return wrap(tx);
        };
    }
    // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
    // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
    // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
    // with real promises, so each advance methods returns a new promise for the cursor object, or
    // undefined if the end of the cursor has been reached.
    if (getCursorAdvanceMethods().includes(func)) {
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            func.apply(unwrap(this), args);
            return wrap(cursorRequestMap.get(this));
        };
    }
    return function (...args) {
        // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
        // the original object.
        return wrap(func.apply(unwrap(this), args));
    };
}
function transformCachableValue(value) {
    if (typeof value === 'function')
        return wrapFunction(value);
    // This doesn't return, it just creates a 'done' promise for the transaction,
    // which is later returned for transaction.done (see idbObjectHandler).
    if (value instanceof IDBTransaction)
        cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
        return new Proxy(value, idbProxyTraps);
    // Return the same value back if we're not going to transform it.
    return value;
}
function wrap(value) {
    // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
    // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
    if (value instanceof IDBRequest)
        return promisifyRequest(value);
    // If we've already transformed this value before, reuse the transformed value.
    // This is faster, but it also provides object equality.
    if (transformCache.has(value))
        return transformCache.get(value);
    const newValue = transformCachableValue(value);
    // Not all types are transformed.
    // These may be primitive types, so they can't be WeakMap keys.
    if (newValue !== value) {
        transformCache.set(value, newValue);
        reverseTransformCache.set(newValue, value);
    }
    return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
        request.addEventListener('upgradeneeded', (event) => {
            upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
        });
    }
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event.newVersion, event));
    }
    openPromise
        .then((db) => {
        if (terminated)
            db.addEventListener('close', () => terminated());
        if (blocking) {
            db.addEventListener('versionchange', (event) => blocking(event.oldVersion, event.newVersion, event));
        }
    })
        .catch(() => { });
    return openPromise;
}
const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase &&
        !(prop in target) &&
        typeof prop === 'string')) {
        return;
    }
    if (cachedMethods.get(prop))
        return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, '');
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
        !(isWrite || readMethods.includes(targetFuncName))) {
        return;
    }
    const method = async function (storeName, ...args) {
        // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
        const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
        let target = tx.store;
        if (useIndex)
            target = target.index(args.shift());
        // Must reject if op rejects.
        // If it's a write operation, must reject if tx.done rejects.
        // Must reject with op rejection first.
        // Must resolve with op value.
        // Must handle both promises (no unhandled rejections)
        return (await Promise.all([
            target[targetFuncName](...args),
            isWrite && tx.done,
        ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class PlatformLoggerServiceImpl {
    constructor(container) {
        this.container = container;
    }
    // In initial implementation, this will be called by installations on
    // auth token refresh, and installations will send this string.
    getPlatformInfoString() {
        const providers = this.container.getProviders();
        // Loop through providers and get library/version pairs from any that are
        // version components.
        return providers
            .map(provider => {
            if (isVersionServiceProvider(provider)) {
                const service = provider.getImmediate();
                return `${service.library}/${service.version}`;
            }
            else {
                return null;
            }
        })
            .filter(logString => logString)
            .join(' ');
    }
}
/**
 *
 * @param provider check if this provider provides a VersionService
 *
 * NOTE: Using Provider<'app-version'> is a hack to indicate that the provider
 * provides VersionService. The provider is not necessarily a 'app-version'
 * provider.
 */
function isVersionServiceProvider(provider) {
    const component = provider.getComponent();
    return component?.type === "VERSION" /* ComponentType.VERSION */;
}
const name$q = "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
const version$1 = "0.14.9";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const logger = new Logger('https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js');
const name$p = "@firebase/app-compat";
const name$o = "@firebase/analytics-compat";
const name$n = "@firebase/analytics";
const name$m = "@firebase/app-check-compat";
const name$l = "@firebase/app-check";
const name$k = "@firebase/auth";
const name$j = "@firebase/auth-compat";
const name$i = "@firebase/database";
const name$h = "@firebase/data-connect";
const name$g = "@firebase/database-compat";
const name$f = "@firebase/functions";
const name$e = "@firebase/functions-compat";
const name$d = "@firebase/installations";
const name$c = "@firebase/installations-compat";
const name$b = "@firebase/messaging";
const name$a = "@firebase/messaging-compat";
const name$9 = "@firebase/performance";
const name$8 = "@firebase/performance-compat";
const name$7 = "@firebase/remote-config";
const name$6 = "@firebase/remote-config-compat";
const name$5 = "@firebase/storage";
const name$4 = "@firebase/storage-compat";
const name$3 = "@firebase/firestore";
const name$2 = "@firebase/ai";
const name$1 = "@firebase/firestore-compat";
const name$r = "firebase";
const version$2 = "12.10.0";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The default app name
 *
 * @internal
 */
const DEFAULT_ENTRY_NAME = '[DEFAULT]';
const PLATFORM_LOG_STRING = {
    [name$q]: 'fire-core',
    [name$p]: 'fire-core-compat',
    [name$n]: 'fire-analytics',
    [name$o]: 'fire-analytics-compat',
    [name$l]: 'fire-app-check',
    [name$m]: 'fire-app-check-compat',
    [name$k]: 'fire-auth',
    [name$j]: 'fire-auth-compat',
    [name$i]: 'fire-rtdb',
    [name$h]: 'fire-data-connect',
    [name$g]: 'fire-rtdb-compat',
    [name$f]: 'fire-fn',
    [name$e]: 'fire-fn-compat',
    [name$d]: 'fire-iid',
    [name$c]: 'fire-iid-compat',
    [name$b]: 'fire-fcm',
    [name$a]: 'fire-fcm-compat',
    [name$9]: 'fire-perf',
    [name$8]: 'fire-perf-compat',
    [name$7]: 'fire-rc',
    [name$6]: 'fire-rc-compat',
    [name$5]: 'fire-gcs',
    [name$4]: 'fire-gcs-compat',
    [name$3]: 'fire-fst',
    [name$1]: 'fire-fst-compat',
    [name$2]: 'fire-vertex',
    'fire-js': 'fire-js', // Platform identifier for JS SDK.
    [name$r]: 'fire-js-all'
};
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @internal
 */
const _apps = new Map();
/**
 * @internal
 */
const _serverApps = new Map();
/**
 * Registered components.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _components = new Map();
/**
 * @param component - the component being added to this app's container
 *
 * @internal
 */
function _addComponent(app, component) {
    try {
        app.container.addComponent(component);
    }
    catch (e) {
        logger.debug(`Component ${component.name} failed to register with FirebaseApp ${app.name}`, e);
    }
}
/**
 *
 * @internal
 */
function _addOrOverwriteComponent(app, component) {
    app.container.addOrOverwriteComponent(component);
}
/**
 *
 * @param component - the component to register
 * @returns whether or not the component is registered successfully
 *
 * @internal
 */
function _registerComponent(component) {
    const componentName = component.name;
    if (_components.has(componentName)) {
        logger.debug(`There were multiple attempts to register component ${componentName}.`);
        return false;
    }
    _components.set(componentName, component);
    // add the component to existing app instances
    for (const app of _apps.values()) {
        _addComponent(app, component);
    }
    for (const serverApp of _serverApps.values()) {
        _addComponent(serverApp, component);
    }
    return true;
}
/**
 *
 * @param app - FirebaseApp instance
 * @param name - service name
 *
 * @returns the provider for the service with the matching name
 *
 * @internal
 */
function _getProvider(app, name) {
    const heartbeatController = app.container
        .getProvider('heartbeat')
        .getImmediate({ optional: true });
    if (heartbeatController) {
        void heartbeatController.triggerHeartbeat();
    }
    return app.container.getProvider(name);
}
/**
 *
 * @param app - FirebaseApp instance
 * @param name - service name
 * @param instanceIdentifier - service instance identifier in case the service supports multiple instances
 *
 * @internal
 */
function _removeServiceInstance(app, name, instanceIdentifier = DEFAULT_ENTRY_NAME) {
    _getProvider(app, name).clearInstance(instanceIdentifier);
}
/**
 *
 * @param obj - an object of type FirebaseApp, FirebaseOptions or FirebaseAppSettings.
 *
 * @returns true if the provide object is of type FirebaseApp.
 *
 * @internal
 */
function _isFirebaseApp(obj) {
    return obj.options !== undefined;
}
/**
 *
 * @param obj - an object of type FirebaseApp, FirebaseOptions or FirebaseAppSettings.
 *
 * @returns true if the provided object is of type FirebaseServerAppImpl.
 *
 * @internal
 */
function _isFirebaseServerAppSettings(obj) {
    if (_isFirebaseApp(obj)) {
        return false;
    }
    return ('authIdToken' in obj ||
        'appCheckToken' in obj ||
        'releaseOnDeref' in obj ||
        'automaticDataCollectionEnabled' in obj);
}
/**
 *
 * @param obj - an object of type FirebaseApp.
 *
 * @returns true if the provided object is of type FirebaseServerAppImpl.
 *
 * @internal
 */
function _isFirebaseServerApp(obj) {
    if (obj === null || obj === undefined) {
        return false;
    }
    return obj.settings !== undefined;
}
/**
 * Test only
 *
 * @internal
 */
function _clearComponents() {
    _components.clear();
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ERRORS = {
    ["no-app" /* AppError.NO_APP */]: "No Firebase App '{$appName}' has been created - " +
        'call initializeApp() first',
    ["bad-app-name" /* AppError.BAD_APP_NAME */]: "Illegal App name: '{$appName}'",
    ["duplicate-app" /* AppError.DUPLICATE_APP */]: "Firebase App named '{$appName}' already exists with different options or config",
    ["app-deleted" /* AppError.APP_DELETED */]: "Firebase App named '{$appName}' already deleted",
    ["server-app-deleted" /* AppError.SERVER_APP_DELETED */]: 'Firebase Server App has been deleted',
    ["no-options" /* AppError.NO_OPTIONS */]: 'Need to provide options, when not being deployed to hosting via source.',
    ["invalid-app-argument" /* AppError.INVALID_APP_ARGUMENT */]: 'firebase.{$appName}() takes either no argument or a ' +
        'Firebase App instance.',
    ["invalid-log-argument" /* AppError.INVALID_LOG_ARGUMENT */]: 'First argument to `onLog` must be null or a function.',
    ["idb-open" /* AppError.IDB_OPEN */]: 'Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.',
    ["idb-get" /* AppError.IDB_GET */]: 'Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.',
    ["idb-set" /* AppError.IDB_WRITE */]: 'Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.',
    ["idb-delete" /* AppError.IDB_DELETE */]: 'Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.',
    ["finalization-registry-not-supported" /* AppError.FINALIZATION_REGISTRY_NOT_SUPPORTED */]: 'FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.',
    ["invalid-server-app-environment" /* AppError.INVALID_SERVER_APP_ENVIRONMENT */]: 'FirebaseServerApp is not for use in browser environments.'
};
const ERROR_FACTORY = new ErrorFactory('app', 'Firebase', ERRORS);
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class FirebaseAppImpl {
    constructor(options, config, container) {
        this._isDeleted = false;
        this._options = { ...options };
        this._config = { ...config };
        this._name = config.name;
        this._automaticDataCollectionEnabled =
            config.automaticDataCollectionEnabled;
        this._container = container;
        this.container.addComponent(new Component('app', () => this, "PUBLIC" /* ComponentType.PUBLIC */));
    }
    get automaticDataCollectionEnabled() {
        this.checkDestroyed();
        return this._automaticDataCollectionEnabled;
    }
    set automaticDataCollectionEnabled(val) {
        this.checkDestroyed();
        this._automaticDataCollectionEnabled = val;
    }
    get name() {
        this.checkDestroyed();
        return this._name;
    }
    get options() {
        this.checkDestroyed();
        return this._options;
    }
    get config() {
        this.checkDestroyed();
        return this._config;
    }
    get container() {
        return this._container;
    }
    get isDeleted() {
        return this._isDeleted;
    }
    set isDeleted(val) {
        this._isDeleted = val;
    }
    /**
     * This function will throw an Error if the App has already been deleted -
     * use before performing API actions on the App.
     */
    checkDestroyed() {
        if (this.isDeleted) {
            throw ERROR_FACTORY.create("app-deleted" /* AppError.APP_DELETED */, { appName: this._name });
        }
    }
}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Parse the token and check to see if the `exp` claim is in the future.
// Reports an error to the console if the token or claim could not be parsed, or if `exp` is in
// the past.
function validateTokenTTL(base64Token, tokenName) {
    const secondPart = base64Decode(base64Token.split('.')[1]);
    if (secondPart === null) {
        console.error(`FirebaseServerApp ${tokenName} is invalid: second part could not be parsed.`);
        return;
    }
    const expClaim = JSON.parse(secondPart).exp;
    if (expClaim === undefined) {
        console.error(`FirebaseServerApp ${tokenName} is invalid: expiration claim could not be parsed`);
        return;
    }
    const exp = JSON.parse(secondPart).exp * 1000;
    const now = new Date().getTime();
    const diff = exp - now;
    if (diff <= 0) {
        console.error(`FirebaseServerApp ${tokenName} is invalid: the token has expired.`);
    }
}
class FirebaseServerAppImpl extends FirebaseAppImpl {
    constructor(options, serverConfig, name, container) {
        // Build configuration parameters for the FirebaseAppImpl base class.
        const automaticDataCollectionEnabled = serverConfig.automaticDataCollectionEnabled !== undefined
            ? serverConfig.automaticDataCollectionEnabled
            : true;
        // Create the FirebaseAppSettings object for the FirebaseAppImp constructor.
        const config = {
            name,
            automaticDataCollectionEnabled
        };
        if (options.apiKey !== undefined) {
            // Construct the parent FirebaseAppImp object.
            super(options, config, container);
        }
        else {
            const appImpl = options;
            super(appImpl.options, config, container);
        }
        // Now construct the data for the FirebaseServerAppImpl.
        this._serverConfig = {
            automaticDataCollectionEnabled,
            ...serverConfig
        };
        // Ensure that the current time is within the `authIdtoken` window of validity.
        if (this._serverConfig.authIdToken) {
            validateTokenTTL(this._serverConfig.authIdToken, 'authIdToken');
        }
        // Ensure that the current time is within the `appCheckToken` window of validity.
        if (this._serverConfig.appCheckToken) {
            validateTokenTTL(this._serverConfig.appCheckToken, 'appCheckToken');
        }
        this._finalizationRegistry = null;
        if (typeof FinalizationRegistry !== 'undefined') {
            this._finalizationRegistry = new FinalizationRegistry(() => {
                this.automaticCleanup();
            });
        }
        this._refCount = 0;
        this.incRefCount(this._serverConfig.releaseOnDeref);
        // Do not retain a hard reference to the dref object, otherwise the FinalizationRegistry
        // will never trigger.
        this._serverConfig.releaseOnDeref = undefined;
        serverConfig.releaseOnDeref = undefined;
        registerVersion(name$q, version$1, 'serverapp');
    }
    toJSON() {
        return undefined;
    }
    get refCount() {
        return this._refCount;
    }
    // Increment the reference count of this server app. If an object is provided, register it
    // with the finalization registry.
    incRefCount(obj) {
        if (this.isDeleted) {
            return;
        }
        this._refCount++;
        if (obj !== undefined && this._finalizationRegistry !== null) {
            this._finalizationRegistry.register(obj, this);
        }
    }
    // Decrement the reference count.
    decRefCount() {
        if (this.isDeleted) {
            return 0;
        }
        return --this._refCount;
    }
    // Invoked by the FinalizationRegistry callback to note that this app should go through its
    // reference counts and delete itself if no reference count remain. The coordinating logic that
    // handles this is in deleteApp(...).
    automaticCleanup() {
        void deleteApp(this);
    }
    get settings() {
        this.checkDestroyed();
        return this._serverConfig;
    }
    /**
     * This function will throw an Error if the App has already been deleted -
     * use before performing API actions on the App.
     */
    checkDestroyed() {
        if (this.isDeleted) {
            throw ERROR_FACTORY.create("server-app-deleted" /* AppError.SERVER_APP_DELETED */);
        }
    }
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The current SDK version.
 *
 * @public
 */
const SDK_VERSION = version$2;
function initializeApp(_options, rawConfig = {}) {
    let options = _options;
    if (typeof rawConfig !== 'object') {
        const name = rawConfig;
        rawConfig = { name };
    }
    const config = {
        name: DEFAULT_ENTRY_NAME,
        automaticDataCollectionEnabled: true,
        ...rawConfig
    };
    const name = config.name;
    if (typeof name !== 'string' || !name) {
        throw ERROR_FACTORY.create("bad-app-name" /* AppError.BAD_APP_NAME */, {
            appName: String(name)
        });
    }
    options || (options = getDefaultAppConfig());
    if (!options) {
        throw ERROR_FACTORY.create("no-options" /* AppError.NO_OPTIONS */);
    }
    const existingApp = _apps.get(name);
    if (existingApp) {
        // return the existing app if options and config deep equal the ones in the existing app.
        if (deepEqual(options, existingApp.options) &&
            deepEqual(config, existingApp.config)) {
            return existingApp;
        }
        else {
            throw ERROR_FACTORY.create("duplicate-app" /* AppError.DUPLICATE_APP */, { appName: name });
        }
    }
    const container = new ComponentContainer(name);
    for (const component of _components.values()) {
        container.addComponent(component);
    }
    const newApp = new FirebaseAppImpl(options, config, container);
    _apps.set(name, newApp);
    return newApp;
}
function initializeServerApp(_options, _serverAppConfig = {}) {
    if (isBrowser() && !isWebWorker()) {
        // FirebaseServerApp isn't designed to be run in browsers.
        throw ERROR_FACTORY.create("invalid-server-app-environment" /* AppError.INVALID_SERVER_APP_ENVIRONMENT */);
    }
    let firebaseOptions;
    let serverAppSettings = _serverAppConfig || {};
    if (_options) {
        if (_isFirebaseApp(_options)) {
            firebaseOptions = _options.options;
        }
        else if (_isFirebaseServerAppSettings(_options)) {
            serverAppSettings = _options;
        }
        else {
            firebaseOptions = _options;
        }
    }
    if (serverAppSettings.automaticDataCollectionEnabled === undefined) {
        serverAppSettings.automaticDataCollectionEnabled = true;
    }
    firebaseOptions || (firebaseOptions = getDefaultAppConfig());
    if (!firebaseOptions) {
        throw ERROR_FACTORY.create("no-options" /* AppError.NO_OPTIONS */);
    }
    // Build an app name based on a hash of the configuration options.
    const nameObj = {
        ...serverAppSettings,
        ...firebaseOptions
    };
    // However, Do not mangle the name based on releaseOnDeref, since it will vary between the
    // construction of FirebaseServerApp instances. For example, if the object is the request headers.
    if (nameObj.releaseOnDeref !== undefined) {
        delete nameObj.releaseOnDeref;
    }
    const hashCode = (s) => {
        return [...s].reduce((hash, c) => (Math.imul(31, hash) + c.charCodeAt(0)) | 0, 0);
    };
    if (serverAppSettings.releaseOnDeref !== undefined) {
        if (typeof FinalizationRegistry === 'undefined') {
            throw ERROR_FACTORY.create("finalization-registry-not-supported" /* AppError.FINALIZATION_REGISTRY_NOT_SUPPORTED */, {});
        }
    }
    const nameString = '' + hashCode(JSON.stringify(nameObj));
    const existingApp = _serverApps.get(nameString);
    if (existingApp) {
        existingApp.incRefCount(serverAppSettings.releaseOnDeref);
        return existingApp;
    }
    const container = new ComponentContainer(nameString);
    for (const component of _components.values()) {
        container.addComponent(component);
    }
    const newApp = new FirebaseServerAppImpl(firebaseOptions, serverAppSettings, nameString, container);
    _serverApps.set(nameString, newApp);
    return newApp;
}
/**
 * Retrieves a {@link @firebase/app#FirebaseApp} instance.
 *
 * When called with no arguments, the default app is returned. When an app name
 * is provided, the app corresponding to that name is returned.
 *
 * An exception is thrown if the app being retrieved has not yet been
 * initialized.
 *
 * @example
 * ```javascript
 * // Return the default app
 * const app = getApp();
 * ```
 *
 * @example
 * ```javascript
 * // Return a named app
 * const otherApp = getApp("otherApp");
 * ```
 *
 * @param name - Optional name of the app to return. If no name is
 *   provided, the default is `"[DEFAULT]"`.
 *
 * @returns The app corresponding to the provided app name.
 *   If no app name is provided, the default app is returned.
 *
 * @public
 */
function getApp(name = DEFAULT_ENTRY_NAME) {
    const app = _apps.get(name);
    if (!app && name === DEFAULT_ENTRY_NAME && getDefaultAppConfig()) {
        return initializeApp();
    }
    if (!app) {
        throw ERROR_FACTORY.create("no-app" /* AppError.NO_APP */, { appName: name });
    }
    return app;
}
/**
 * A (read-only) array of all initialized apps.
 * @public
 */
function getApps() {
    return Array.from(_apps.values());
}
/**
 * Renders this app unusable and frees the resources of all associated
 * services.
 *
 * @example
 * ```javascript
 * deleteApp(app)
 *   .then(function() {
 *     console.log("App deleted successfully");
 *   })
 *   .catch(function(error) {
 *     console.log("Error deleting app:", error);
 *   });
 * ```
 *
 * @public
 */
async function deleteApp(app) {
    let cleanupProviders = false;
    const name = app.name;
    if (_apps.has(name)) {
        cleanupProviders = true;
        _apps.delete(name);
    }
    else if (_serverApps.has(name)) {
        const firebaseServerApp = app;
        if (firebaseServerApp.decRefCount() <= 0) {
            _serverApps.delete(name);
            cleanupProviders = true;
        }
    }
    if (cleanupProviders) {
        await Promise.all(app.container
            .getProviders()
            .map(provider => provider.delete()));
        app.isDeleted = true;
    }
}
/**
 * Registers a library's name and version for platform logging purposes.
 * @param library - Name of 1p or 3p library (e.g. firestore, angularfire)
 * @param version - Current version of that library.
 * @param variant - Bundle variant, e.g., node, rn, etc.
 *
 * @public
 */
function registerVersion(libraryKeyOrName, version, variant) {
    // TODO: We can use this check to whitelist strings when/if we set up
    // a good whitelist system.
    let library = PLATFORM_LOG_STRING[libraryKeyOrName] ?? libraryKeyOrName;
    if (variant) {
        library += `-${variant}`;
    }
    const libraryMismatch = library.match(/\s|\//);
    const versionMismatch = version.match(/\s|\//);
    if (libraryMismatch || versionMismatch) {
        const warning = [
            `Unable to register library "${library}" with version "${version}":`
        ];
        if (libraryMismatch) {
            warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
        }
        if (libraryMismatch && versionMismatch) {
            warning.push('and');
        }
        if (versionMismatch) {
            warning.push(`version name "${version}" contains illegal characters (whitespace or "/")`);
        }
        logger.warn(warning.join(' '));
        return;
    }
    _registerComponent(new Component(`${library}-version`, () => ({ library, version }), "VERSION" /* ComponentType.VERSION */));
}
/**
 * Sets log handler for all Firebase SDKs.
 * @param logCallback - An optional custom log handler that executes user code whenever
 * the Firebase SDK makes a logging call.
 *
 * @public
 */
function onLog(logCallback, options) {
    if (logCallback !== null && typeof logCallback !== 'function') {
        throw ERROR_FACTORY.create("invalid-log-argument" /* AppError.INVALID_LOG_ARGUMENT */);
    }
    setUserLogHandler(logCallback, options);
}
/**
 * Sets log level for all Firebase SDKs.
 *
 * All of the log types above the current log level are captured (i.e. if
 * you set the log level to `info`, errors are logged, but `debug` and
 * `verbose` logs are not).
 *
 * @public
 */
function setLogLevel(logLevel) {
    setLogLevel$1(logLevel);
}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DB_NAME = 'firebase-heartbeat-database';
const DB_VERSION = 1;
const STORE_NAME = 'firebase-heartbeat-store';
let dbPromise = null;
function getDbPromise() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade: (db, oldVersion) => {
                // We don't use 'break' in this switch statement, the fall-through
                // behavior is what we want, because if there are multiple versions between
                // the old version and the current version, we want ALL the migrations
                // that correspond to those versions to run, not only the last one.
                // eslint-disable-next-line default-case
                switch (oldVersion) {
                    case 0:
                        try {
                            db.createObjectStore(STORE_NAME);
                        }
                        catch (e) {
                            // Safari/iOS browsers throw occasional exceptions on
                            // db.createObjectStore() that may be a bug. Avoid blocking
                            // the rest of the app functionality.
                            console.warn(e);
                        }
                }
            }
        }).catch(e => {
            throw ERROR_FACTORY.create("idb-open" /* AppError.IDB_OPEN */, {
                originalErrorMessage: e.message
            });
        });
    }
    return dbPromise;
}
async function readHeartbeatsFromIndexedDB(app) {
    try {
        const db = await getDbPromise();
        const tx = db.transaction(STORE_NAME);
        const result = await tx.objectStore(STORE_NAME).get(computeKey(app));
        // We already have the value but tx.done can throw,
        // so we need to await it here to catch errors
        await tx.done;
        return result;
    }
    catch (e) {
        if (e instanceof FirebaseError) {
            logger.warn(e.message);
        }
        else {
            const idbGetError = ERROR_FACTORY.create("idb-get" /* AppError.IDB_GET */, {
                originalErrorMessage: e?.message
            });
            logger.warn(idbGetError.message);
        }
    }
}
async function writeHeartbeatsToIndexedDB(app, heartbeatObject) {
    try {
        const db = await getDbPromise();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const objectStore = tx.objectStore(STORE_NAME);
        await objectStore.put(heartbeatObject, computeKey(app));
        await tx.done;
    }
    catch (e) {
        if (e instanceof FirebaseError) {
            logger.warn(e.message);
        }
        else {
            const idbGetError = ERROR_FACTORY.create("idb-set" /* AppError.IDB_WRITE */, {
                originalErrorMessage: e?.message
            });
            logger.warn(idbGetError.message);
        }
    }
}
function computeKey(app) {
    return `${app.name}!${app.options.appId}`;
}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const MAX_HEADER_BYTES = 1024;
const MAX_NUM_STORED_HEARTBEATS = 30;
class HeartbeatServiceImpl {
    constructor(container) {
        this.container = container;
        /**
         * In-memory cache for heartbeats, used by getHeartbeatsHeader() to generate
         * the header string.
         * Stores one record per date. This will be consolidated into the standard
         * format of one record per user agent string before being sent as a header.
         * Populated from indexedDB when the controller is instantiated and should
         * be kept in sync with indexedDB.
         * Leave public for easier testing.
         */
        this._heartbeatsCache = null;
        const app = this.container.getProvider('app').getImmediate();
        this._storage = new HeartbeatStorageImpl(app);
        this._heartbeatsCachePromise = this._storage.read().then(result => {
            this._heartbeatsCache = result;
            return result;
        });
    }
    /**
     * Called to report a heartbeat. The function will generate
     * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
     * to IndexedDB.
     * Note that we only store one heartbeat per day. So if a heartbeat for today is
     * already logged, subsequent calls to this function in the same day will be ignored.
     */
    async triggerHeartbeat() {
        try {
            const platformLogger = this.container
                .getProvider('platform-logger')
                .getImmediate();
            // This is the "Firebase user agent" string from the platform logger
            // service, not the browser user agent.
            const agent = platformLogger.getPlatformInfoString();
            const date = getUTCDateString();
            if (this._heartbeatsCache?.heartbeats == null) {
                this._heartbeatsCache = await this._heartbeatsCachePromise;
                // If we failed to construct a heartbeats cache, then return immediately.
                if (this._heartbeatsCache?.heartbeats == null) {
                    return;
                }
            }
            // Do not store a heartbeat if one is already stored for this day
            // or if a header has already been sent today.
            if (this._heartbeatsCache.lastSentHeartbeatDate === date ||
                this._heartbeatsCache.heartbeats.some(singleDateHeartbeat => singleDateHeartbeat.date === date)) {
                return;
            }
            else {
                // There is no entry for this date. Create one.
                this._heartbeatsCache.heartbeats.push({ date, agent });
                // If the number of stored heartbeats exceeds the maximum number of stored heartbeats, remove the heartbeat with the earliest date.
                // Since this is executed each time a heartbeat is pushed, the limit can only be exceeded by one, so only one needs to be removed.
                if (this._heartbeatsCache.heartbeats.length > MAX_NUM_STORED_HEARTBEATS) {
                    const earliestHeartbeatIdx = getEarliestHeartbeatIdx(this._heartbeatsCache.heartbeats);
                    this._heartbeatsCache.heartbeats.splice(earliestHeartbeatIdx, 1);
                }
            }
            return this._storage.overwrite(this._heartbeatsCache);
        }
        catch (e) {
            logger.warn(e);
        }
    }
    /**
     * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
     * It also clears all heartbeats from memory as well as in IndexedDB.
     *
     * NOTE: Consuming product SDKs should not send the header if this method
     * returns an empty string.
     */
    async getHeartbeatsHeader() {
        try {
            if (this._heartbeatsCache === null) {
                await this._heartbeatsCachePromise;
            }
            // If it's still null or the array is empty, there is no data to send.
            if (this._heartbeatsCache?.heartbeats == null ||
                this._heartbeatsCache.heartbeats.length === 0) {
                return '';
            }
            const date = getUTCDateString();
            // Extract as many heartbeats from the cache as will fit under the size limit.
            const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
            const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
            // Store last sent date to prevent another being logged/sent for the same day.
            this._heartbeatsCache.lastSentHeartbeatDate = date;
            if (unsentEntries.length > 0) {
                // Store any unsent entries if they exist.
                this._heartbeatsCache.heartbeats = unsentEntries;
                // This seems more likely than emptying the array (below) to lead to some odd state
                // since the cache isn't empty and this will be called again on the next request,
                // and is probably safest if we await it.
                await this._storage.overwrite(this._heartbeatsCache);
            }
            else {
                this._heartbeatsCache.heartbeats = [];
                // Do not wait for this, to reduce latency.
                void this._storage.overwrite(this._heartbeatsCache);
            }
            return headerString;
        }
        catch (e) {
            logger.warn(e);
            return '';
        }
    }
}
function getUTCDateString() {
    const today = new Date();
    // Returns date format 'YYYY-MM-DD'
    return today.toISOString().substring(0, 10);
}
function extractHeartbeatsForHeader(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
    // Heartbeats grouped by user agent in the standard format to be sent in
    // the header.
    const heartbeatsToSend = [];
    // Single date format heartbeats that are not sent.
    let unsentEntries = heartbeatsCache.slice();
    for (const singleDateHeartbeat of heartbeatsCache) {
        // Look for an existing entry with the same user agent.
        const heartbeatEntry = heartbeatsToSend.find(hb => hb.agent === singleDateHeartbeat.agent);
        if (!heartbeatEntry) {
            // If no entry for this user agent exists, create one.
            heartbeatsToSend.push({
                agent: singleDateHeartbeat.agent,
                dates: [singleDateHeartbeat.date]
            });
            if (countBytes(heartbeatsToSend) > maxSize) {
                // If the header would exceed max size, remove the added heartbeat
                // entry and stop adding to the header.
                heartbeatsToSend.pop();
                break;
            }
        }
        else {
            heartbeatEntry.dates.push(singleDateHeartbeat.date);
            // If the header would exceed max size, remove the added date
            // and stop adding to the header.
            if (countBytes(heartbeatsToSend) > maxSize) {
                heartbeatEntry.dates.pop();
                break;
            }
        }
        // Pop unsent entry from queue. (Skipped if adding the entry exceeded
        // quota and the loop breaks early.)
        unsentEntries = unsentEntries.slice(1);
    }
    return {
        heartbeatsToSend,
        unsentEntries
    };
}
class HeartbeatStorageImpl {
    constructor(app) {
        this.app = app;
        this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
    }
    async runIndexedDBEnvironmentCheck() {
        if (!isIndexedDBAvailable()) {
            return false;
        }
        else {
            return validateIndexedDBOpenable()
                .then(() => true)
                .catch(() => false);
        }
    }
    /**
     * Read all heartbeats.
     */
    async read() {
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
            return { heartbeats: [] };
        }
        else {
            const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
            if (idbHeartbeatObject?.heartbeats) {
                return idbHeartbeatObject;
            }
            else {
                return { heartbeats: [] };
            }
        }
    }
    // overwrite the storage with the provided heartbeats
    async overwrite(heartbeatsObject) {
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
            return;
        }
        else {
            const existingHeartbeatsObject = await this.read();
            return writeHeartbeatsToIndexedDB(this.app, {
                lastSentHeartbeatDate: heartbeatsObject.lastSentHeartbeatDate ??
                    existingHeartbeatsObject.lastSentHeartbeatDate,
                heartbeats: heartbeatsObject.heartbeats
            });
        }
    }
    // add heartbeats
    async add(heartbeatsObject) {
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
            return;
        }
        else {
            const existingHeartbeatsObject = await this.read();
            return writeHeartbeatsToIndexedDB(this.app, {
                lastSentHeartbeatDate: heartbeatsObject.lastSentHeartbeatDate ??
                    existingHeartbeatsObject.lastSentHeartbeatDate,
                heartbeats: [
                    ...existingHeartbeatsObject.heartbeats,
                    ...heartbeatsObject.heartbeats
                ]
            });
        }
    }
}
/**
 * Calculate bytes of a HeartbeatsByUserAgent array after being wrapped
 * in a platform logging header JSON object, stringified, and converted
 * to base 64.
 */
function countBytes(heartbeatsCache) {
    // base64 has a restricted set of characters, all of which should be 1 byte.
    return base64urlEncodeWithoutPadding(
    // heartbeatsCache wrapper properties
    JSON.stringify({ version: 2, heartbeats: heartbeatsCache })).length;
}
/**
 * Returns the index of the heartbeat with the earliest date.
 * If the heartbeats array is empty, -1 is returned.
 */
function getEarliestHeartbeatIdx(heartbeats) {
    if (heartbeats.length === 0) {
        return -1;
    }
    let earliestHeartbeatIdx = 0;
    let earliestHeartbeatDate = heartbeats[0].date;
    for (let i = 1; i < heartbeats.length; i++) {
        if (heartbeats[i].date < earliestHeartbeatDate) {
            earliestHeartbeatDate = heartbeats[i].date;
            earliestHeartbeatIdx = i;
        }
    }
    return earliestHeartbeatIdx;
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function registerCoreComponents(variant) {
    _registerComponent(new Component('platform-logger', container => new PlatformLoggerServiceImpl(container), "PRIVATE" /* ComponentType.PRIVATE */));
    _registerComponent(new Component('heartbeat', container => new HeartbeatServiceImpl(container), "PRIVATE" /* ComponentType.PRIVATE */));
    // Register `app` package.
    registerVersion(name$q, version$1, variant);
    // BUILD_TARGET will be replaced by values like esm, cjs, etc during the compilation
    registerVersion(name$q, version$1, 'esm2020');
    // Register platform SDK identifier (no version).
    registerVersion('fire-js', '');
}
/**
 * Firebase App
 *
 * @remarks This package coordinates the communication between the different Firebase components
 * @packageDocumentation
 */
registerCoreComponents('');

var name = "firebase";
var version = "12.10.0";

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
registerVersion(name, version, 'cdn');

export { FirebaseError, SDK_VERSION, DEFAULT_ENTRY_NAME as _DEFAULT_ENTRY_NAME, _addComponent, _addOrOverwriteComponent, _apps, _clearComponents, _components, _getProvider, _isFirebaseApp, _isFirebaseServerApp, _isFirebaseServerAppSettings, _registerComponent, _removeServiceInstance, _serverApps, deleteApp, getApp, getApps, initializeApp, initializeServerApp, onLog, registerVersion, setLogLevel };

//# sourceMappingURL=firebase-app.js.map

import{_isFirebaseServerApp as e,_getProvider,getApp as r,_removeServiceInstance as i,_registerComponent as s,registerVersion as o,SDK_VERSION as _}from"https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";const stringToByteArray$1=function(e){const r=[];let i=0;for(let s=0;s<e.length;s++){let o=e.charCodeAt(s);o<128?r[i++]=o:o<2048?(r[i++]=o>>6|192,r[i++]=63&o|128):55296==(64512&o)&&s+1<e.length&&56320==(64512&e.charCodeAt(s+1))?(o=65536+((1023&o)<<10)+(1023&e.charCodeAt(++s)),r[i++]=o>>18|240,r[i++]=o>>12&63|128,r[i++]=o>>6&63|128,r[i++]=63&o|128):(r[i++]=o>>12|224,r[i++]=o>>6&63|128,r[i++]=63&o|128)}return r},h={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(e,r){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const i=r?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let r=0;r<e.length;r+=3){const o=e[r],_=r+1<e.length,h=_?e[r+1]:0,d=r+2<e.length,f=d?e[r+2]:0,g=o>>2,A=(3&o)<<4|h>>4;let b=(15&h)<<2|f>>6,M=63&f;d||(M=64,_||(b=64)),s.push(i[g],i[A],i[b],i[M])}return s.join("")},encodeString(e,r){return this.HAS_NATIVE_SUPPORT&&!r?btoa(e):this.encodeByteArray(stringToByteArray$1(e),r)},decodeString(e,r){return this.HAS_NATIVE_SUPPORT&&!r?atob(e):function(e){const r=[];let i=0,s=0;for(;i<e.length;){const o=e[i++];if(o<128)r[s++]=String.fromCharCode(o);else if(o>191&&o<224){const _=e[i++];r[s++]=String.fromCharCode((31&o)<<6|63&_)}else if(o>239&&o<365){const _=((7&o)<<18|(63&e[i++])<<12|(63&e[i++])<<6|63&e[i++])-65536;r[s++]=String.fromCharCode(55296+(_>>10)),r[s++]=String.fromCharCode(56320+(1023&_))}else{const _=e[i++],h=e[i++];r[s++]=String.fromCharCode((15&o)<<12|(63&_)<<6|63&h)}}return r.join("")}(this.decodeStringToByteArray(e,r))},decodeStringToByteArray(e,r){this.init_();const i=r?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let r=0;r<e.length;){const o=i[e.charAt(r++)],_=r<e.length?i[e.charAt(r)]:0;++r;const h=r<e.length?i[e.charAt(r)]:64;++r;const d=r<e.length?i[e.charAt(r)]:64;if(++r,null==o||null==_||null==h||null==d)throw new DecodeBase64StringError;const f=o<<2|_>>4;if(s.push(f),64!==h){const e=_<<4&240|h>>2;if(s.push(e),64!==d){const e=h<<6&192|d;s.push(e)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class DecodeBase64StringError extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const base64urlEncodeWithoutPadding=function(e){return function(e){const r=stringToByteArray$1(e);return h.encodeByteArray(r,!0)}(e).replace(/\./g,"")};function getGlobal(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if("undefined"!=typeof global)return global;throw new Error("Unable to locate global object.")}const getDefaultsFromCookie=()=>{if("undefined"==typeof document)return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(e){return}const r=e&&function(e){try{return h.decodeString(e,!0)}catch(e){console.error("base64Decode failed: ",e)}return null}(e[1]);return r&&JSON.parse(r)},getDefaults=()=>{try{return getGlobal().__FIREBASE_DEFAULTS__||(()=>{if("undefined"==typeof process||void 0===process.env)return;const e=process.env.__FIREBASE_DEFAULTS__;return e?JSON.parse(e):void 0})()||getDefaultsFromCookie()}catch(e){return void console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`)}},getDefaultEmulatorHostnameAndPort=e=>{const r=(e=>getDefaults()?.emulatorHosts?.[e])(e);if(!r)return;const i=r.lastIndexOf(":");if(i<=0||i+1===r.length)throw new Error(`Invalid host ${r} with no separate hostname and port!`);const s=parseInt(r.substring(i+1),10);return"["===r[0]?[r.substring(1,i-1),s]:[r.substring(0,i),s]};function isCloudWorkstation(e){try{return(e.startsWith("http://")||e.startsWith("https://")?new URL(e).hostname:e).endsWith(".cloudworkstations.dev")}catch{return!1}}async function pingServer(e){return(await fetch(e,{credentials:"include"})).ok}const d={};let f=!1;function updateEmulatorBanner(e,r){if("undefined"==typeof window||"undefined"==typeof document||!isCloudWorkstation(window.location.host)||d[e]===r||d[e]||f)return;function prefixedId(e){return`__firebase__banner__${e}`}d[e]=r;const i="__firebase__banner",s=function getEmulatorSummary(){const e={prod:[],emulator:[]};for(const r of Object.keys(d))d[r]?e.emulator.push(r):e.prod.push(r);return e}().prod.length>0;function setupCloseBtn(){const e=document.createElement("span");return e.style.cursor="pointer",e.style.marginLeft="16px",e.style.fontSize="24px",e.innerHTML=" &times;",e.onclick=()=>{f=!0,function tearDown(){const e=document.getElementById(i);e&&e.remove()}()},e}function setupDom(){const e=function getOrCreateEl(e){let r=document.getElementById(e),i=!1;return r||(r=document.createElement("div"),r.setAttribute("id",e),i=!0),{created:i,element:r}}(i),r=prefixedId("text"),o=document.getElementById(r)||document.createElement("span"),_=prefixedId("learnmore"),h=document.getElementById(_)||document.createElement("a"),d=prefixedId("preprendIcon"),f=document.getElementById(d)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(e.created){const r=e.element;!function setupBannerStyles(e){e.style.display="flex",e.style.background="#7faaf0",e.style.position="fixed",e.style.bottom="5px",e.style.left="5px",e.style.padding=".5em",e.style.borderRadius="5px",e.style.alignItems="center"}(r),function setupLinkStyles(e,r){e.setAttribute("id",r),e.innerText="Learn more",e.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",e.setAttribute("target","__blank"),e.style.paddingLeft="5px",e.style.textDecoration="underline"}(h,_);const i=setupCloseBtn();!function setupIconStyles(e,r){e.setAttribute("width","24"),e.setAttribute("id",r),e.setAttribute("height","24"),e.setAttribute("viewBox","0 0 24 24"),e.setAttribute("fill","none"),e.style.marginLeft="-6px"}(f,d),r.append(f,o,h,i),document.body.appendChild(r)}s?(o.innerText="Preview backend disconnected.",f.innerHTML='<g clip-path="url(#clip0_6013_33858)">\n<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>\n</g>\n<defs>\n<clipPath id="clip0_6013_33858">\n<rect width="24" height="24" fill="white"/>\n</clipPath>\n</defs>'):(f.innerHTML='<g clip-path="url(#clip0_6083_34804)">\n<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>\n</g>\n<defs>\n<clipPath id="clip0_6083_34804">\n<rect width="24" height="24" fill="white"/>\n</clipPath>\n</defs>',o.innerText="Preview backend running in this workspace."),o.setAttribute("id",r)}"loading"===document.readyState?window.addEventListener("DOMContentLoaded",setupDom):setupDom()}function getUA(){return"undefined"!=typeof navigator&&"string"==typeof navigator.userAgent?navigator.userAgent:""}function isNode(){const e=getDefaults()?.forceEnvironment;if("node"===e)return!0;if("browser"===e)return!1;try{return"[object process]"===Object.prototype.toString.call(global.process)}catch(e){return!1}}function isSafari(){return!isNode()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function isSafariOrWebkit(){return!isNode()&&!!navigator.userAgent&&(navigator.userAgent.includes("Safari")||navigator.userAgent.includes("WebKit"))&&!navigator.userAgent.includes("Chrome")}class FirebaseError extends Error{constructor(e,r,i){super(r),this.code=e,this.customData=i,this.name="FirebaseError",Object.setPrototypeOf(this,FirebaseError.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ErrorFactory.prototype.create)}}class ErrorFactory{constructor(e,r,i){this.service=e,this.serviceName=r,this.errors=i}create(e,...r){const i=r[0]||{},s=`${this.service}/${e}`,o=this.errors[e],_=o?function replaceTemplate(e,r){return e.replace(g,((e,i)=>{const s=r[i];return null!=s?String(s):`<${i}?>`}))}(o,i):"Error",h=`${this.serviceName}: ${_} (${s}).`;return new FirebaseError(s,h,i)}}const g=/\{\$([^}]+)}/g;function deepEqual(e,r){if(e===r)return!0;const i=Object.keys(e),s=Object.keys(r);for(const o of i){if(!s.includes(o))return!1;const i=e[o],_=r[o];if(isObject(i)&&isObject(_)){if(!deepEqual(i,_))return!1}else if(i!==_)return!1}for(const e of s)if(!i.includes(e))return!1;return!0}function isObject(e){return null!==e&&"object"==typeof e}function getModularInstance(e){return e&&e._delegate?e._delegate:e}class Component{constructor(e,r,i){this.name=e,this.instanceFactory=r,this.type=i,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}var A,b,M,q="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};(function(){var e;function m(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}function n(e,r,i){i||(i=0);const s=Array(16);if("string"==typeof r)for(var o=0;o<16;++o)s[o]=r.charCodeAt(i++)|r.charCodeAt(i++)<<8|r.charCodeAt(i++)<<16|r.charCodeAt(i++)<<24;else for(o=0;o<16;++o)s[o]=r[i++]|r[i++]<<8|r[i++]<<16|r[i++]<<24;r=e.g[0],i=e.g[1],o=e.g[2];let _,h=e.g[3];_=r+(h^i&(o^h))+s[0]+3614090360&4294967295,_=h+(o^(r=i+(_<<7&4294967295|_>>>25))&(i^o))+s[1]+3905402710&4294967295,h=r+(_<<12&4294967295|_>>>20),_=o+(i^h&(r^i))+s[2]+606105819&4294967295,_=i+(r^(o=h+(_<<17&4294967295|_>>>15))&(h^r))+s[3]+3250441966&4294967295,_=r+(h^(i=o+(_<<22&4294967295|_>>>10))&(o^h))+s[4]+4118548399&4294967295,_=h+(o^(r=i+(_<<7&4294967295|_>>>25))&(i^o))+s[5]+1200080426&4294967295,h=r+(_<<12&4294967295|_>>>20),_=o+(i^h&(r^i))+s[6]+2821735955&4294967295,_=i+(r^(o=h+(_<<17&4294967295|_>>>15))&(h^r))+s[7]+4249261313&4294967295,_=r+(h^(i=o+(_<<22&4294967295|_>>>10))&(o^h))+s[8]+1770035416&4294967295,_=h+(o^(r=i+(_<<7&4294967295|_>>>25))&(i^o))+s[9]+2336552879&4294967295,h=r+(_<<12&4294967295|_>>>20),_=o+(i^h&(r^i))+s[10]+4294925233&4294967295,_=i+(r^(o=h+(_<<17&4294967295|_>>>15))&(h^r))+s[11]+2304563134&4294967295,_=r+(h^(i=o+(_<<22&4294967295|_>>>10))&(o^h))+s[12]+1804603682&4294967295,_=h+(o^(r=i+(_<<7&4294967295|_>>>25))&(i^o))+s[13]+4254626195&4294967295,h=r+(_<<12&4294967295|_>>>20),_=o+(i^h&(r^i))+s[14]+2792965006&4294967295,_=i+(r^(o=h+(_<<17&4294967295|_>>>15))&(h^r))+s[15]+1236535329&4294967295,_=r+(o^h&((i=o+(_<<22&4294967295|_>>>10))^o))+s[1]+4129170786&4294967295,_=h+(i^o&((r=i+(_<<5&4294967295|_>>>27))^i))+s[6]+3225465664&4294967295,h=r+(_<<9&4294967295|_>>>23),_=o+(r^i&(h^r))+s[11]+643717713&4294967295,_=i+(h^r&((o=h+(_<<14&4294967295|_>>>18))^h))+s[0]+3921069994&4294967295,_=r+(o^h&((i=o+(_<<20&4294967295|_>>>12))^o))+s[5]+3593408605&4294967295,_=h+(i^o&((r=i+(_<<5&4294967295|_>>>27))^i))+s[10]+38016083&4294967295,h=r+(_<<9&4294967295|_>>>23),_=o+(r^i&(h^r))+s[15]+3634488961&4294967295,_=i+(h^r&((o=h+(_<<14&4294967295|_>>>18))^h))+s[4]+3889429448&4294967295,_=r+(o^h&((i=o+(_<<20&4294967295|_>>>12))^o))+s[9]+568446438&4294967295,_=h+(i^o&((r=i+(_<<5&4294967295|_>>>27))^i))+s[14]+3275163606&4294967295,h=r+(_<<9&4294967295|_>>>23),_=o+(r^i&(h^r))+s[3]+4107603335&4294967295,_=i+(h^r&((o=h+(_<<14&4294967295|_>>>18))^h))+s[8]+1163531501&4294967295,_=r+(o^h&((i=o+(_<<20&4294967295|_>>>12))^o))+s[13]+2850285829&4294967295,_=h+(i^o&((r=i+(_<<5&4294967295|_>>>27))^i))+s[2]+4243563512&4294967295,h=r+(_<<9&4294967295|_>>>23),_=o+(r^i&(h^r))+s[7]+1735328473&4294967295,_=i+(h^r&((o=h+(_<<14&4294967295|_>>>18))^h))+s[12]+2368359562&4294967295,_=r+((i=o+(_<<20&4294967295|_>>>12))^o^h)+s[5]+4294588738&4294967295,_=h+((r=i+(_<<4&4294967295|_>>>28))^i^o)+s[8]+2272392833&4294967295,h=r+(_<<11&4294967295|_>>>21),_=o+(h^r^i)+s[11]+1839030562&4294967295,_=i+((o=h+(_<<16&4294967295|_>>>16))^h^r)+s[14]+4259657740&4294967295,_=r+((i=o+(_<<23&4294967295|_>>>9))^o^h)+s[1]+2763975236&4294967295,_=h+((r=i+(_<<4&4294967295|_>>>28))^i^o)+s[4]+1272893353&4294967295,h=r+(_<<11&4294967295|_>>>21),_=o+(h^r^i)+s[7]+4139469664&4294967295,_=i+((o=h+(_<<16&4294967295|_>>>16))^h^r)+s[10]+3200236656&4294967295,_=r+((i=o+(_<<23&4294967295|_>>>9))^o^h)+s[13]+681279174&4294967295,_=h+((r=i+(_<<4&4294967295|_>>>28))^i^o)+s[0]+3936430074&4294967295,h=r+(_<<11&4294967295|_>>>21),_=o+(h^r^i)+s[3]+3572445317&4294967295,_=i+((o=h+(_<<16&4294967295|_>>>16))^h^r)+s[6]+76029189&4294967295,_=r+((i=o+(_<<23&4294967295|_>>>9))^o^h)+s[9]+3654602809&4294967295,_=h+((r=i+(_<<4&4294967295|_>>>28))^i^o)+s[12]+3873151461&4294967295,h=r+(_<<11&4294967295|_>>>21),_=o+(h^r^i)+s[15]+530742520&4294967295,_=i+((o=h+(_<<16&4294967295|_>>>16))^h^r)+s[2]+3299628645&4294967295,_=r+(o^((i=o+(_<<23&4294967295|_>>>9))|~h))+s[0]+4096336452&4294967295,_=h+(i^((r=i+(_<<6&4294967295|_>>>26))|~o))+s[7]+1126891415&4294967295,h=r+(_<<10&4294967295|_>>>22),_=o+(r^(h|~i))+s[14]+2878612391&4294967295,_=i+(h^((o=h+(_<<15&4294967295|_>>>17))|~r))+s[5]+4237533241&4294967295,_=r+(o^((i=o+(_<<21&4294967295|_>>>11))|~h))+s[12]+1700485571&4294967295,_=h+(i^((r=i+(_<<6&4294967295|_>>>26))|~o))+s[3]+2399980690&4294967295,h=r+(_<<10&4294967295|_>>>22),_=o+(r^(h|~i))+s[10]+4293915773&4294967295,_=i+(h^((o=h+(_<<15&4294967295|_>>>17))|~r))+s[1]+2240044497&4294967295,_=r+(o^((i=o+(_<<21&4294967295|_>>>11))|~h))+s[8]+1873313359&4294967295,_=h+(i^((r=i+(_<<6&4294967295|_>>>26))|~o))+s[15]+4264355552&4294967295,h=r+(_<<10&4294967295|_>>>22),_=o+(r^(h|~i))+s[6]+2734768916&4294967295,_=i+(h^((o=h+(_<<15&4294967295|_>>>17))|~r))+s[13]+1309151649&4294967295,_=r+(o^((i=o+(_<<21&4294967295|_>>>11))|~h))+s[4]+4149444226&4294967295,_=h+(i^((r=i+(_<<6&4294967295|_>>>26))|~o))+s[11]+3174756917&4294967295,h=r+(_<<10&4294967295|_>>>22),_=o+(r^(h|~i))+s[2]+718787259&4294967295,_=i+(h^((o=h+(_<<15&4294967295|_>>>17))|~r))+s[9]+3951481745&4294967295,e.g[0]=e.g[0]+r&4294967295,e.g[1]=e.g[1]+(o+(_<<21&4294967295|_>>>11))&4294967295,e.g[2]=e.g[2]+o&4294967295,e.g[3]=e.g[3]+h&4294967295}function t(e,r){this.h=r;const i=[];let s=!0;for(let o=e.length-1;o>=0;o--){const _=0|e[o];s&&_==r||(i[o]=_,s=!1)}this.g=i}!function k(e,r){function c(){}c.prototype=r.prototype,e.F=r.prototype,e.prototype=new c,e.prototype.constructor=e,e.D=function(e,i,s){for(var o=Array(arguments.length-2),_=2;_<arguments.length;_++)o[_-2]=arguments[_];return r.prototype[i].apply(e,o)}}(m,(function l(){this.blockSize=-1})),m.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0},m.prototype.v=function(e,r){void 0===r&&(r=e.length);const i=r-this.blockSize,s=this.C;let o=this.h,_=0;for(;_<r;){if(0==o)for(;_<=i;)n(this,e,_),_+=this.blockSize;if("string"==typeof e){for(;_<r;)if(s[o++]=e.charCodeAt(_++),o==this.blockSize){n(this,s),o=0;break}}else for(;_<r;)if(s[o++]=e[_++],o==this.blockSize){n(this,s),o=0;break}}this.h=o,this.o+=r},m.prototype.A=function(){var e=Array((this.h<56?this.blockSize:2*this.blockSize)-this.h);e[0]=128;for(var r=1;r<e.length-8;++r)e[r]=0;r=8*this.o;for(var i=e.length-8;i<e.length;++i)e[i]=255&r,r/=256;for(this.v(e),e=Array(16),r=0,i=0;i<4;++i)for(let s=0;s<32;s+=8)e[r++]=this.g[i]>>>s&255;return e};var r={};function u(e){return-128<=e&&e<128?function p(e,i){var s=r;return Object.prototype.hasOwnProperty.call(s,e)?s[e]:s[e]=i(e)}(e,(function(e){return new t([0|e],e<0?-1:0)})):new t([0|e],e<0?-1:0)}function v(e){if(isNaN(e)||!isFinite(e))return i;if(e<0)return x(v(-e));const r=[];let s=1;for(let i=0;e>=s;i++)r[i]=e/s|0,s*=4294967296;return new t(r,0)}var i=u(0),s=u(1),o=u(16777216);function C(e){if(0!=e.h)return!1;for(let r=0;r<e.g.length;r++)if(0!=e.g[r])return!1;return!0}function B(e){return-1==e.h}function x(e){const r=e.g.length,i=[];for(let s=0;s<r;s++)i[s]=~e.g[s];return new t(i,~e.h).add(s)}function F(e,r){return e.add(x(r))}function G(e,r){for(;(65535&e[r])!=e[r];)e[r+1]+=e[r]>>>16,e[r]&=65535,r++}function H(e,r){this.g=e,this.h=r}function D(e,r){if(C(r))throw Error("division by zero");if(C(e))return new H(i,i);if(B(e))return r=D(x(e),r),new H(x(r.g),x(r.h));if(B(r))return r=D(e,x(r)),new H(x(r.g),r.h);if(e.g.length>30){if(B(e)||B(r))throw Error("slowDivide_ only works with positive integers.");for(var o=s,_=r;_.l(e)<=0;)o=I(o),_=I(_);var h=J(o,1),d=J(_,1);for(_=J(_,2),o=J(o,2);!C(_);){var f=d.add(_);f.l(e)<=0&&(h=h.add(o),d=f),_=J(_,1),o=J(o,1)}return r=F(e,h.j(r)),new H(h,r)}for(h=i;e.l(r)>=0;){for(o=Math.max(1,Math.floor(e.m()/r.m())),_=(_=Math.ceil(Math.log(o)/Math.LN2))<=48?1:Math.pow(2,_-48),f=(d=v(o)).j(r);B(f)||f.l(e)>0;)f=(d=v(o-=_)).j(r);C(d)&&(d=s),h=h.add(d),e=F(e,f)}return new H(h,e)}function I(e){const r=e.g.length+1,i=[];for(let s=0;s<r;s++)i[s]=e.i(s)<<1|e.i(s-1)>>>31;return new t(i,e.h)}function J(e,r){const i=r>>5;r%=32;const s=e.g.length-i,o=[];for(let _=0;_<s;_++)o[_]=r>0?e.i(_+i)>>>r|e.i(_+i+1)<<32-r:e.i(_+i);return new t(o,e.h)}(e=t.prototype).m=function(){if(B(this))return-x(this).m();let e=0,r=1;for(let i=0;i<this.g.length;i++){const s=this.i(i);e+=(s>=0?s:4294967296+s)*r,r*=4294967296}return e},e.toString=function(e){if((e=e||10)<2||36<e)throw Error("radix out of range: "+e);if(C(this))return"0";if(B(this))return"-"+x(this).toString(e);const r=v(Math.pow(e,6));var i=this;let s="";for(;;){const o=D(i,r).g;let _=(((i=F(i,o.j(r))).g.length>0?i.g[0]:i.h)>>>0).toString(e);if(C(i=o))return _+s;for(;_.length<6;)_="0"+_;s=_+s}},e.i=function(e){return e<0?0:e<this.g.length?this.g[e]:this.h},e.l=function(e){return B(e=F(this,e))?-1:C(e)?0:1},e.abs=function(){return B(this)?x(this):this},e.add=function(e){const r=Math.max(this.g.length,e.g.length),i=[];let s=0;for(let o=0;o<=r;o++){let r=s+(65535&this.i(o))+(65535&e.i(o)),_=(r>>>16)+(this.i(o)>>>16)+(e.i(o)>>>16);s=_>>>16,r&=65535,_&=65535,i[o]=_<<16|r}return new t(i,-2147483648&i[i.length-1]?-1:0)},e.j=function(e){if(C(this)||C(e))return i;if(B(this))return B(e)?x(this).j(x(e)):x(x(this).j(e));if(B(e))return x(this.j(x(e)));if(this.l(o)<0&&e.l(o)<0)return v(this.m()*e.m());const r=this.g.length+e.g.length,s=[];for(var _=0;_<2*r;_++)s[_]=0;for(_=0;_<this.g.length;_++)for(let r=0;r<e.g.length;r++){const i=this.i(_)>>>16,o=65535&this.i(_),h=e.i(r)>>>16,d=65535&e.i(r);s[2*_+2*r]+=o*d,G(s,2*_+2*r),s[2*_+2*r+1]+=i*d,G(s,2*_+2*r+1),s[2*_+2*r+1]+=o*h,G(s,2*_+2*r+1),s[2*_+2*r+2]+=i*h,G(s,2*_+2*r+2)}for(e=0;e<r;e++)s[e]=s[2*e+1]<<16|s[2*e];for(e=r;e<2*r;e++)s[e]=0;return new t(s,0)},e.B=function(e){return D(this,e).h},e.and=function(e){const r=Math.max(this.g.length,e.g.length),i=[];for(let s=0;s<r;s++)i[s]=this.i(s)&e.i(s);return new t(i,this.h&e.h)},e.or=function(e){const r=Math.max(this.g.length,e.g.length),i=[];for(let s=0;s<r;s++)i[s]=this.i(s)|e.i(s);return new t(i,this.h|e.h)},e.xor=function(e){const r=Math.max(this.g.length,e.g.length),i=[];for(let s=0;s<r;s++)i[s]=this.i(s)^e.i(s);return new t(i,this.h^e.h)},m.prototype.digest=m.prototype.A,m.prototype.reset=m.prototype.u,m.prototype.update=m.prototype.v,b=m,t.prototype.add=t.prototype.add,t.prototype.multiply=t.prototype.j,t.prototype.modulo=t.prototype.B,t.prototype.compare=t.prototype.l,t.prototype.toNumber=t.prototype.m,t.prototype.toString=t.prototype.toString,t.prototype.getBits=t.prototype.i,t.fromNumber=v,t.fromString=function y(e,r){if(0==e.length)throw Error("number format error: empty string");if((r=r||10)<2||36<r)throw Error("radix out of range: "+r);if("-"==e.charAt(0))return x(y(e.substring(1),r));if(e.indexOf("-")>=0)throw Error('number format error: interior "-" character');const s=v(Math.pow(r,8));let o=i;for(let i=0;i<e.length;i+=8){var _=Math.min(8,e.length-i);const h=parseInt(e.substring(i,i+_),r);_<8?(_=v(Math.pow(r,_)),o=o.j(_).add(v(h))):(o=o.j(s),o=o.add(v(h)))}return o},A=t}).apply(void 0!==q?q:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{}),function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"}(M||(M={}));const j={debug:M.DEBUG,verbose:M.VERBOSE,info:M.INFO,warn:M.WARN,error:M.ERROR,silent:M.SILENT},$=M.INFO,ee={[M.DEBUG]:"log",[M.VERBOSE]:"log",[M.INFO]:"info",[M.WARN]:"warn",[M.ERROR]:"error"},defaultLogHandler=(e,r,...i)=>{if(r<e.logLevel)return;const s=(new Date).toISOString(),o=ee[r];if(!o)throw new Error(`Attempted to log a message with an invalid logType (value: ${r})`);console[o](`[${s}]  ${e.name}:`,...i)};var te,ne,re,ie,se,oe,ae,ce,ue="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};(function(){var e,r=Object.defineProperty;var i=function ba(e){e=["object"==typeof globalThis&&globalThis,e,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof ue&&ue];for(var r=0;r<e.length;++r){var i=e[r];if(i&&i.Math==Math)return i}throw Error("Cannot find global object")}(this);function da(e,s){if(s)e:{var o=i;e=e.split(".");for(var _=0;_<e.length-1;_++){var h=e[_];if(!(h in o))break e;o=o[h]}(s=s(_=o[e=e[e.length-1]]))!=_&&null!=s&&r(o,e,{configurable:!0,writable:!0,value:s})}}da("Symbol.dispose",(function(e){return e||Symbol("Symbol.dispose")})),da("Array.prototype.values",(function(e){return e||function(){return this[Symbol.iterator]()}})),da("Object.entries",(function(e){return e||function(e){var r,i=[];for(r in e)Object.prototype.hasOwnProperty.call(e,r)&&i.push([r,e[r]]);return i}}));var s=s||{},o=this||self;function n(e){var r=typeof e;return"object"==r&&null!=e||"function"==r}function fa(e,r,i){return e.call.apply(e.bind,arguments)}function p(e,r,i){return(p=fa).apply(null,arguments)}function ha(e,r){var i=Array.prototype.slice.call(arguments,1);return function(){var r=i.slice();return r.push.apply(r,arguments),e.apply(this,r)}}function t(e,r){function c(){}c.prototype=r.prototype,e.Z=r.prototype,e.prototype=new c,e.prototype.constructor=e,e.Ob=function(e,i,s){for(var o=Array(arguments.length-2),_=2;_<arguments.length;_++)o[_-2]=arguments[_];return r.prototype[i].apply(e,o)}}var _="undefined"!=typeof AsyncContext&&"function"==typeof AsyncContext.Snapshot?e=>e&&AsyncContext.Snapshot.wrap(e):e=>e;function ja(e){const r=e.length;if(r>0){const i=Array(r);for(let s=0;s<r;s++)i[s]=e[s];return i}return[]}function ka(e,r){for(let r=1;r<arguments.length;r++){const s=arguments[r];var i=typeof s;if("array"==(i="object"!=i?i:s?Array.isArray(s)?"array":i:"null")||"object"==i&&"number"==typeof s.length){i=e.length||0;const r=s.length||0;e.length=i+r;for(let o=0;o<r;o++)e[i+o]=s[o]}else e.push(s)}}function ma(e){o.setTimeout((()=>{throw e}),0)}function na(){var e=g;let r=null;return e.g&&(r=e.g,e.g=e.g.next,e.g||(e.h=null),r.next=null),r}var h=new class la{constructor(e,r){this.i=e,this.j=r,this.h=0,this.g=null}get(){let e;return this.h>0?(this.h--,e=this.g,this.g=e.next,e.next=null):e=this.i(),e}}((()=>new ra),(e=>e.reset()));class ra{constructor(){this.next=this.g=this.h=null}set(e,r){this.h=e,this.g=r,this.next=null}reset(){this.next=this.g=this.h=null}}let d,f=!1,g=new class pa{constructor(){this.h=this.g=null}add(e,r){const i=h.get();i.set(e,r),this.h?this.h.next=i:this.g=i,this.h=i}},ta=()=>{const e=Promise.resolve(void 0);d=()=>{e.then(sa)}};function sa(){for(var e;e=na();){try{e.h.call(e.g)}catch(e){ma(e)}var r=h;r.j(e),r.h<100&&(r.h++,e.next=r.g,r.g=e)}f=!1}function w(){this.u=this.u,this.C=this.C}function x(e,r){this.type=e,this.g=this.target=r,this.defaultPrevented=!1}w.prototype.u=!1,w.prototype.dispose=function(){this.u||(this.u=!0,this.N())},w.prototype[Symbol.dispose]=function(){this.dispose()},w.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()},x.prototype.h=function(){this.defaultPrevented=!0};var A=function(){if(!o.addEventListener||!Object.defineProperty)return!1;var e=!1,r=Object.defineProperty({},"passive",{get:function(){e=!0}});try{const c=()=>{};o.addEventListener("test",c,r),o.removeEventListener("test",c,r)}catch(e){}return e}();function y(e){return/^[\s\xa0]*$/.test(e)}function z(e,r){x.call(this,e?e.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,e&&this.init(e,r)}t(z,x),z.prototype.init=function(e,r){const i=this.type=e.type,s=e.changedTouches&&e.changedTouches.length?e.changedTouches[0]:null;this.target=e.target||e.srcElement,this.g=r,(r=e.relatedTarget)||("mouseover"==i?r=e.fromElement:"mouseout"==i&&(r=e.toElement)),this.relatedTarget=r,s?(this.clientX=void 0!==s.clientX?s.clientX:s.pageX,this.clientY=void 0!==s.clientY?s.clientY:s.pageY,this.screenX=s.screenX||0,this.screenY=s.screenY||0):(this.clientX=void 0!==e.clientX?e.clientX:e.pageX,this.clientY=void 0!==e.clientY?e.clientY:e.pageY,this.screenX=e.screenX||0,this.screenY=e.screenY||0),this.button=e.button,this.key=e.key||"",this.ctrlKey=e.ctrlKey,this.altKey=e.altKey,this.shiftKey=e.shiftKey,this.metaKey=e.metaKey,this.pointerId=e.pointerId||0,this.pointerType=e.pointerType,this.state=e.state,this.i=e,e.defaultPrevented&&z.Z.h.call(this)},z.prototype.h=function(){z.Z.h.call(this);const e=this.i;e.preventDefault?e.preventDefault():e.returnValue=!1};var b="closure_listenable_"+(1e6*Math.random()|0),M=0;function wa(e,r,i,s,o){this.listener=e,this.proxy=null,this.src=r,this.type=i,this.capture=!!s,this.ha=o,this.key=++M,this.da=this.fa=!1}function xa(e){e.da=!0,e.listener=null,e.proxy=null,e.src=null,e.ha=null}function ya(e,r,i){for(const s in e)r.call(i,e[s],s,e)}function Ba(e){const r={};for(const i in e)r[i]=e[i];return r}const q="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Da(e,r){let i,s;for(let r=1;r<arguments.length;r++){for(i in s=arguments[r],s)e[i]=s[i];for(let r=0;r<q.length;r++)i=q[r],Object.prototype.hasOwnProperty.call(s,i)&&(e[i]=s[i])}}function Ea(e){this.src=e,this.g={},this.h=0}function Ga(e,r){const i=r.type;if(i in e.g){var s,o=e.g[i],_=Array.prototype.indexOf.call(o,r,void 0);(s=_>=0)&&Array.prototype.splice.call(o,_,1),s&&(xa(r),0==e.g[i].length&&(delete e.g[i],e.h--))}}function Fa(e,r,i,s){for(let o=0;o<e.length;++o){const _=e[o];if(!_.da&&_.listener==r&&_.capture==!!i&&_.ha==s)return o}return-1}Ea.prototype.add=function(e,r,i,s,o){const _=e.toString();(e=this.g[_])||(e=this.g[_]=[],this.h++);const h=Fa(e,r,s,o);return h>-1?(r=e[h],i||(r.fa=!1)):((r=new wa(r,this.src,_,!!s,o)).fa=i,e.push(r)),r};var j="closure_lm_"+(1e6*Math.random()|0),$={};function Ka(e,r,i,s,o){if(s&&s.once)return La(e,r,i,s,o);if(Array.isArray(r)){for(let _=0;_<r.length;_++)Ka(e,r[_],i,s,o);return null}return i=Ma(i),e&&e[b]?e.J(r,i,n(s)?!!s.capture:!!s,o):Na(e,r,i,!1,s,o)}function Na(e,r,i,s,o,_){if(!r)throw Error("Invalid event type");const h=n(o)?!!o.capture:!!o;let d=Oa(e);if(d||(e[j]=d=new Ea(e)),(i=d.add(r,i,s,h,_)).proxy)return i;if(s=function Pa(){function a(r){return e.call(a.src,a.listener,r)}const e=Ra;return a}(),i.proxy=s,s.src=e,s.listener=i,e.addEventListener)A||(o=h),void 0===o&&(o=!1),e.addEventListener(r.toString(),s,o);else if(e.attachEvent)e.attachEvent(Qa(r.toString()),s);else{if(!e.addListener||!e.removeListener)throw Error("addEventListener and attachEvent are unavailable.");e.addListener(s)}return i}function La(e,r,i,s,o){if(Array.isArray(r)){for(let _=0;_<r.length;_++)La(e,r[_],i,s,o);return null}return i=Ma(i),e&&e[b]?e.K(r,i,n(s)?!!s.capture:!!s,o):Na(e,r,i,!0,s,o)}function Sa(e,r,i,s,o){if(Array.isArray(r))for(var _=0;_<r.length;_++)Sa(e,r[_],i,s,o);else s=n(s)?!!s.capture:!!s,i=Ma(i),e&&e[b]?(e=e.i,(_=String(r).toString())in e.g&&((i=Fa(r=e.g[_],i,s,o))>-1&&(xa(r[i]),Array.prototype.splice.call(r,i,1),0==r.length&&(delete e.g[_],e.h--)))):e&&(e=Oa(e))&&(r=e.g[r.toString()],e=-1,r&&(e=Fa(r,i,s,o)),(i=e>-1?r[e]:null)&&Ta(i))}function Ta(e){if("number"!=typeof e&&e&&!e.da){var r=e.src;if(r&&r[b])Ga(r.i,e);else{var i=e.type,s=e.proxy;r.removeEventListener?r.removeEventListener(i,s,e.capture):r.detachEvent?r.detachEvent(Qa(i),s):r.addListener&&r.removeListener&&r.removeListener(s),(i=Oa(r))?(Ga(i,e),0==i.h&&(i.src=null,r[j]=null)):xa(e)}}}function Qa(e){return e in $?$[e]:$[e]="on"+e}function Ra(e,r){if(e.da)e=!0;else{r=new z(r,this);const i=e.listener,s=e.ha||e.src;e.fa&&Ta(e),e=i.call(s,r)}return e}function Oa(e){return(e=e[j])instanceof Ea?e:null}var ee="__closure_events_fn_"+(1e9*Math.random()>>>0);function Ma(e){return"function"==typeof e?e:(e[ee]||(e[ee]=function(r){return e.handleEvent(r)}),e[ee])}function C(){w.call(this),this.i=new Ea(this),this.M=this,this.G=null}function D(e,r){var i,s=e.G;if(s)for(i=[];s;s=s.G)i.push(s);if(e=e.M,s=r.type||r,"string"==typeof r)r=new x(r,e);else if(r instanceof x)r.target=r.target||e;else{var o=r;Da(r=new x(s,e),o)}let _,h;if(o=!0,i)for(h=i.length-1;h>=0;h--)_=r.g=i[h],o=Va(_,s,!0,r)&&o;if(_=r.g=e,o=Va(_,s,!0,r)&&o,o=Va(_,s,!1,r)&&o,i)for(h=0;h<i.length;h++)_=r.g=i[h],o=Va(_,s,!1,r)&&o}function Va(e,r,i,s){if(!(r=e.i.g[String(r)]))return!0;r=r.concat();let o=!0;for(let _=0;_<r.length;++_){const h=r[_];if(h&&!h.da&&h.capture==i){const r=h.listener,i=h.ha||h.src;h.fa&&Ga(e.i,h),o=!1!==r.call(i,s)&&o}}return o&&!s.defaultPrevented}function Xa(e){e.g=function Wa(e,r){if("function"!=typeof e){if(!e||"function"!=typeof e.handleEvent)throw Error("Invalid listener argument");e=p(e.handleEvent,e)}return Number(r)>2147483647?-1:o.setTimeout(e,r||0)}((()=>{e.g=null,e.i&&(e.i=!1,Xa(e))}),e.l);const r=e.h;e.h=null,e.m.apply(null,r)}t(C,w),C.prototype[b]=!0,C.prototype.removeEventListener=function(e,r,i,s){Sa(this,e,r,i,s)},C.prototype.N=function(){if(C.Z.N.call(this),this.i){var e=this.i;for(const r in e.g){const i=e.g[r];for(let e=0;e<i.length;e++)xa(i[e]);delete e.g[r],e.h--}}this.G=null},C.prototype.J=function(e,r,i,s){return this.i.add(String(e),r,!1,i,s)},C.prototype.K=function(e,r,i,s){return this.i.add(String(e),r,!0,i,s)};class Ya extends w{constructor(e,r){super(),this.m=e,this.l=r,this.h=null,this.i=!1,this.g=null}j(e){this.h=arguments,this.g?this.i=!0:Xa(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function E(e){w.call(this),this.h=e,this.g={}}t(E,w);var le=[];function $a(e){ya(e.g,(function(e,r){this.g.hasOwnProperty(r)&&Ta(e)}),e),e.g={}}E.prototype.N=function(){E.Z.N.call(this),$a(this)},E.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var _e=o.JSON.stringify,he=o.JSON.parse,de=class{stringify(e){return o.JSON.stringify(e,void 0)}parse(e){return o.JSON.parse(e,void 0)}};function eb(){}function fb(){}var me={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function gb(){x.call(this,"d")}function hb(){x.call(this,"c")}t(gb,x),t(hb,x);var fe={},ge=null;function jb(){return ge=ge||new C}function kb(e){x.call(this,fe.Ia,e)}function lb(e){const r=jb();D(r,new kb(r))}function mb(e,r){x.call(this,fe.STAT_EVENT,e),this.stat=r}function J(e){const r=jb();D(r,new mb(r,e))}function nb(e,r){x.call(this,fe.Ja,e),this.size=r}function ob(e,r){if("function"!=typeof e)throw Error("Fn must not be null and must be a function");return o.setTimeout((function(){e()}),r)}function pb(){this.g=!0}function K(e,r,i,s){e.info((function(){return"XMLHTTP TEXT ("+r+"): "+function sb(e,r){if(!e.g)return r;if(!r)return null;try{const _=JSON.parse(r);if(_)for(e=0;e<_.length;e++)if(Array.isArray(_[e])){var i=_[e];if(!(i.length<2)){var s=i[1];if(Array.isArray(s)&&!(s.length<1)){var o=s[0];if("noop"!=o&&"stop"!=o&&"close"!=o)for(let e=1;e<s.length;e++)s[e]=""}}}return _e(_)}catch(e){return r}}(e,i)+(s?" "+s:"")}))}fe.Ia="serverreachability",t(kb,x),fe.STAT_EVENT="statevent",t(mb,x),fe.Ja="timingevent",t(nb,x),pb.prototype.ua=function(){this.g=!1},pb.prototype.info=function(){};var pe,Ie={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},Te={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"};function xb(){}function L(e){return encodeURIComponent(String(e))}function yb(e){var r=1;e=e.split(":");const i=[];for(;r>0&&e.length;)i.push(e.shift()),r--;return e.length&&i.push(e.join(":")),i}function N(e,r,i,s){this.j=e,this.i=r,this.l=i,this.S=s||1,this.V=new E(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new zb}function zb(){this.i=null,this.g="",this.h=!1}t(xb,eb),xb.prototype.g=function(){return new XMLHttpRequest},pe=new xb;var Ee={},Pe={};function Cb(e,r,i){e.M=1,e.A=Db(O(r)),e.u=i,e.R=!0,Eb(e,null)}function Eb(e,r){e.F=Date.now(),Fb(e),e.B=O(e.A);var i=e.B,s=e.S;Array.isArray(s)||(s=[String(s)]),Gb(i.i,"t",s),e.C=0,i=e.j.L,e.h=new zb,e.g=Hb(e.j,i?r:null,!e.u),e.P>0&&(e.O=new Ya(p(e.Y,e,e.g),e.P)),r=e.V,i=e.g,s=e.ba;var o="readystatechange";Array.isArray(o)||(o&&(le[0]=o.toString()),o=le);for(let e=0;e<o.length;e++){const _=Ka(i,o[e],s||r.handleEvent,!1,r.h||r);if(!_)break;r.g[_.key]=_}r=e.J?Ba(e.J):{},e.u?(e.v||(e.v="POST"),r["Content-Type"]="application/x-www-form-urlencoded",e.g.ea(e.B,e.v,e.u,r)):(e.v="GET",e.g.ea(e.B,e.v,null,r)),lb(),function qb(e,r,i,s,o,_){e.info((function(){if(e.g)if(_){var h="",d=_.split("&");for(let e=0;e<d.length;e++){var f=d[e].split("=");if(f.length>1){const e=f[0];f=f[1];const r=e.split("_");h=r.length>=2&&"type"==r[1]?h+(e+"=")+f+"&":h+(e+"=redacted&")}}}else h=null;else h=_;return"XMLHTTP REQ ("+s+") [attempt "+o+"]: "+r+"\n"+i+"\n"+h}))}(e.i,e.v,e.B,e.l,e.S,e.u)}function Ob(e){return!!e.g&&("GET"==e.v&&2!=e.M&&e.j.Aa)}function Nb(e,r){var i=e.C,s=r.indexOf("\n",i);return-1==s?Pe:(i=Number(r.substring(i,s)),isNaN(i)?Ee:(s+=1)+i>r.length?Pe:(r=r.slice(s,s+i),e.C=s+i,r))}function Fb(e){e.T=Date.now()+e.H,Sb(e,e.H)}function Sb(e,r){if(null!=e.D)throw Error("WatchDog timer not null");e.D=ob(p(e.aa,e),r)}function Jb(e){e.D&&(o.clearTimeout(e.D),e.D=null)}function Mb(e){0==e.j.I||e.K||Qb(e.j,e)}function Q(e){Jb(e);var r=e.O;r&&"function"==typeof r.dispose&&r.dispose(),e.O=null,$a(e.V),e.g&&(r=e.g,e.g=null,r.abort(),r.dispose())}function Lb(e,r){try{var i=e.j;if(0!=i.I&&(i.g==e||Tb(i.h,e)))if(!e.L&&Tb(i.h,e)&&3==i.I){try{var s=i.Ba.g.parse(r)}catch(e){s=null}if(Array.isArray(s)&&3==s.length){var o=s;if(0==o[0]){e:if(!i.v){if(i.g){if(!(i.g.F+3e3<e.F))break e;Ub(i),Vb(i)}Wb(i),J(18)}}else i.xa=o[1],0<i.xa-i.K&&o[2]<37500&&i.F&&0==i.A&&!i.C&&(i.C=ob(p(i.Va,i),6e3));Xb(i.h)<=1&&i.ta&&(i.ta=void 0)}else R(i,11)}else if((e.L||i.g==e)&&Ub(i),!y(r))for(o=i.Ba.g.parse(r),r=0;r<o.length;r++){let g=o[r];const A=g[0];if(!(A<=i.K))if(i.K=A,g=g[1],2==i.I)if("c"==g[0]){i.M=g[1],i.ba=g[2];const r=g[3];null!=r&&(i.ka=r,i.j.info("VER="+i.ka));const o=g[4];null!=o&&(i.za=o,i.j.info("SVER="+i.za));const A=g[5];null!=A&&"number"==typeof A&&A>0&&(s=1.5*A,i.O=s,i.j.info("backChannelRequestTimeoutMs_="+s)),s=i;const b=e.g;if(b){const e=b.g?b.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(e){var _=s.h;_.g||-1==e.indexOf("spdy")&&-1==e.indexOf("quic")&&-1==e.indexOf("h2")||(_.j=_.l,_.g=new Set,_.h&&(Yb(_,_.h),_.h=null))}if(s.G){const e=b.g?b.g.getResponseHeader("X-HTTP-Session-Id"):null;e&&(s.wa=e,S(s.J,s.G,e))}}i.I=3,i.l&&i.l.ra(),i.aa&&(i.T=Date.now()-e.F,i.j.info("Handshake RTT: "+i.T+"ms"));var h=e;if((s=i).na=Zb(s,s.L?s.ba:null,s.W),h.L){$b(s.h,h);var d=h,f=s.O;f&&(d.H=f),d.D&&(Jb(d),Fb(d)),s.g=h}else ac(s);i.i.length>0&&bc(i)}else"stop"!=g[0]&&"close"!=g[0]||R(i,7);else 3==i.I&&("stop"==g[0]||"close"==g[0]?"stop"==g[0]?R(i,7):cc(i):"noop"!=g[0]&&i.l&&i.l.qa(g),i.A=0)}lb()}catch(e){}}N.prototype.ba=function(e){e=e.target;const r=this.O;r&&3==P(e)?r.j():this.Y(e)},N.prototype.Y=function(e){try{if(e==this.g)e:{const f=P(this.g),g=this.g.ya();this.g.ca();if(!(f<3)&&(3!=f||this.g&&(this.h.h||this.g.la()||Ib(this.g)))){this.K||4!=f||7==g||lb(),Jb(this);var r=this.g.ca();this.X=r;var i=function Kb(e){if(!Ob(e))return e.g.la();const r=Ib(e.g);if(""===r)return"";let i="";const s=r.length,_=4==P(e.g);if(!e.h.i){if("undefined"==typeof TextDecoder)return Q(e),Mb(e),"";e.h.i=new o.TextDecoder}for(let o=0;o<s;o++)e.h.h=!0,i+=e.h.i.decode(r[o],{stream:!(_&&o==s-1)});return r.length=0,e.h.g+=i,e.C=0,e.h.g}(this);if(this.o=200==r,function rb(e,r,i,s,o,_,h){e.info((function(){return"XMLHTTP RESP ("+s+") [ attempt "+o+"]: "+r+"\n"+i+"\n"+_+" "+h}))}(this.i,this.v,this.B,this.l,this.S,f,r),this.o){if(this.U&&!this.L){t:{if(this.g){var s,_=this.g;if((s=_.g?_.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!y(s)){var h=s;break t}}h=null}if(!(e=h)){this.o=!1,this.m=3,J(12),Q(this),Mb(this);break e}K(this.i,this.l,e,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Lb(this,e)}if(this.R){let r;for(e=!0;!this.K&&this.C<i.length;){if(r=Nb(this,i),r==Pe){4==f&&(this.m=4,J(14),e=!1),K(this.i,this.l,null,"[Incomplete Response]");break}if(r==Ee){this.m=4,J(15),K(this.i,this.l,i,"[Invalid Chunk]"),e=!1;break}K(this.i,this.l,r,null),Lb(this,r)}if(Ob(this)&&0!=this.C&&(this.h.g=this.h.g.slice(this.C),this.C=0),4!=f||0!=i.length||this.h.h||(this.m=1,J(16),e=!1),this.o=this.o&&e,e){if(i.length>0&&!this.W){this.W=!0;var d=this.j;d.g==this&&d.aa&&!d.P&&(d.j.info("Great, no buffering proxy detected. Bytes received: "+i.length),Pb(d),d.P=!0,J(11))}}else K(this.i,this.l,i,"[Invalid Chunked Response]"),Q(this),Mb(this)}else K(this.i,this.l,i,null),Lb(this,i);4==f&&Q(this),this.o&&!this.K&&(4==f?Qb(this.j,this):(this.o=!1,Fb(this)))}else(function Rb(e){const r={};e=(e.g&&P(e)>=2&&e.g.getAllResponseHeaders()||"").split("\r\n");for(let s=0;s<e.length;s++){if(y(e[s]))continue;var i=yb(e[s]);const o=i[0];if("string"!=typeof(i=i[1]))continue;i=i.trim();const _=r[o]||[];r[o]=_,_.push(i)}!function Aa(e,r){for(const i in e)r.call(void 0,e[i],i,e)}(r,(function(e){return e.join(", ")}))})(this.g),400==r&&i.indexOf("Unknown SID")>0?(this.m=3,J(12)):(this.m=0,J(13)),Q(this),Mb(this)}}}catch(e){}},N.prototype.cancel=function(){this.K=!0,Q(this)},N.prototype.aa=function(){this.D=null;const e=Date.now();e-this.T>=0?(function tb(e,r){e.info((function(){return"TIMEOUT: "+r}))}(this.i,this.B),2!=this.M&&(lb(),J(17)),Q(this),this.m=2,Mb(this)):Sb(this,this.T-e)};var Ae=class{constructor(e,r){this.g=e,this.map=r}};function ec(e){this.l=e||10,o.PerformanceNavigationTiming?e=(e=o.performance.getEntriesByType("navigation")).length>0&&("hq"==e[0].nextHopProtocol||"h2"==e[0].nextHopProtocol):e=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=e?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function fc(e){return!!e.h||!!e.g&&e.g.size>=e.j}function Xb(e){return e.h?1:e.g?e.g.size:0}function Tb(e,r){return e.h?e.h==r:!!e.g&&e.g.has(r)}function Yb(e,r){e.g?e.g.add(r):e.h=r}function $b(e,r){e.h&&e.h==r?e.h=null:e.g&&e.g.has(r)&&e.g.delete(r)}function hc(e){if(null!=e.h)return e.i.concat(e.h.G);if(null!=e.g&&0!==e.g.size){let r=e.i;for(const i of e.g.values())r=r.concat(i.G);return r}return ja(e.i)}ec.prototype.cancel=function(){if(this.i=hc(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&0!==this.g.size){for(const e of this.g.values())e.cancel();this.g.clear()}};var Re=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function T(e){let r;this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1,e instanceof T?(this.l=e.l,kc(this,e.j),this.o=e.o,this.g=e.g,lc(this,e.u),this.h=e.h,mc(this,nc(e.i)),this.m=e.m):e&&(r=String(e).match(Re))?(this.l=!1,kc(this,r[1]||"",!0),this.o=oc(r[2]||""),this.g=oc(r[3]||"",!0),lc(this,r[4]),this.h=oc(r[5]||"",!0),mc(this,r[6]||"",!0),this.m=oc(r[7]||"")):(this.l=!1,this.i=new pc(null,this.l))}function O(e){return new T(e)}function kc(e,r,i){e.j=i?oc(r,!0):r,e.j&&(e.j=e.j.replace(/:$/,""))}function lc(e,r){if(r){if(r=Number(r),isNaN(r)||r<0)throw Error("Bad port number "+r);e.u=r}else e.u=null}function mc(e,r,i){r instanceof pc?(e.i=r,function vc(e,r){r&&!e.j&&(U(e),e.i=null,e.g.forEach((function(e,r){const i=r.toLowerCase();r!=i&&(yc(this,r),Gb(this,i,e))}),e)),e.j=r}(e.i,e.l)):(i||(r=qc(r,Se)),e.i=new pc(r,e.l))}function S(e,r,i){e.i.set(r,i)}function Db(e){return S(e,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),e}function oc(e,r){return e?r?decodeURI(e.replace(/%25/g,"%2525")):decodeURIComponent(e):""}function qc(e,r,i){return"string"==typeof e?(e=encodeURI(e).replace(r,xc),i&&(e=e.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),e):null}function xc(e){return"%"+((e=e.charCodeAt(0))>>4&15).toString(16)+(15&e).toString(16)}T.prototype.toString=function(){const e=[];var r=this.j;r&&e.push(qc(r,ye,!0),":");var i=this.g;return(i||"file"==r)&&(e.push("//"),(r=this.o)&&e.push(qc(r,ye,!0),"@"),e.push(L(i).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),null!=(i=this.u)&&e.push(":",String(i))),(i=this.h)&&(this.g&&"/"!=i.charAt(0)&&e.push("/"),e.push(qc(i,"/"==i.charAt(0)?be:Ve,!0))),(i=this.i.toString())&&e.push("?",i),(i=this.m)&&e.push("#",qc(i,we)),e.join("")},T.prototype.resolve=function(e){const r=O(this);let i=!!e.j;i?kc(r,e.j):i=!!e.o,i?r.o=e.o:i=!!e.g,i?r.g=e.g:i=null!=e.u;var s=e.h;if(i)lc(r,e.u);else if(i=!!e.h){if("/"!=s.charAt(0))if(this.g&&!this.h)s="/"+s;else{var o=r.h.lastIndexOf("/");-1!=o&&(s=r.h.slice(0,o+1)+s)}if(".."==(o=s)||"."==o)s="";else if(-1!=o.indexOf("./")||-1!=o.indexOf("/.")){s=0==o.lastIndexOf("/",0),o=o.split("/");const e=[];for(let r=0;r<o.length;){const i=o[r++];"."==i?s&&r==o.length&&e.push(""):".."==i?((e.length>1||1==e.length&&""!=e[0])&&e.pop(),s&&r==o.length&&e.push("")):(e.push(i),s=!0)}s=e.join("/")}else s=o}return i?r.h=s:i=""!==e.i.toString(),i?mc(r,nc(e.i)):i=!!e.m,i&&(r.m=e.m),r};var ye=/[#\/\?@]/g,Ve=/[#\?:]/g,be=/[#\?]/g,Se=/[#\?@]/g,we=/#/g;function pc(e,r){this.h=this.g=null,this.i=e||null,this.j=!!r}function U(e){e.g||(e.g=new Map,e.h=0,e.i&&function jc(e,r){if(e){e=e.split("&");for(let i=0;i<e.length;i++){const s=e[i].indexOf("=");let o,_=null;s>=0?(o=e[i].substring(0,s),_=e[i].substring(s+1)):o=e[i],r(o,_?decodeURIComponent(_.replace(/\+/g," ")):"")}}}(e.i,(function(r,i){e.add(decodeURIComponent(r.replace(/\+/g," ")),i)})))}function yc(e,r){U(e),r=V(e,r),e.g.has(r)&&(e.i=null,e.h-=e.g.get(r).length,e.g.delete(r))}function zc(e,r){return U(e),r=V(e,r),e.g.has(r)}function Ac(e,r){U(e);let i=[];if("string"==typeof r)zc(e,r)&&(i=i.concat(e.g.get(V(e,r))));else for(e=Array.from(e.g.values()),r=0;r<e.length;r++)i=i.concat(e[r]);return i}function Gb(e,r,i){yc(e,r),i.length>0&&(e.i=null,e.g.set(V(e,r),ja(i)),e.h+=i.length)}function nc(e){const r=new pc;return r.i=e.i,e.g&&(r.g=new Map(e.g),r.h=e.h),r}function V(e,r){return r=String(r),e.j&&(r=r.toLowerCase()),r}function W(e,r,i,s,o){try{o&&(o.onload=null,o.onerror=null,o.onabort=null,o.ontimeout=null),s(i)}catch(e){}}function Dc(){this.g=new de}function Ec(e){this.i=e.Sb||null,this.h=e.ab||!1}function Fc(e,r){C.call(this),this.H=e,this.o=r,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}function Ic(e){e.j.read().then(e.Ma.bind(e)).catch(e.ga.bind(e))}function Hc(e){e.readyState=4,e.l=null,e.j=null,e.B=null,Gc(e)}function Gc(e){e.onreadystatechange&&e.onreadystatechange.call(e)}function Jc(e){let r="";return ya(e,(function(e,i){r+=i,r+=":",r+=e,r+="\r\n"})),r}function Kc(e,r,i){e:{for(s in i){var s=!1;break e}s=!0}s||(i=Jc(i),"string"==typeof e?null!=i&&L(i):S(e,r,i))}function X(e){C.call(this),this.headers=new Map,this.L=e||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}(e=pc.prototype).add=function(e,r){U(this),this.i=null,e=V(this,e);let i=this.g.get(e);return i||this.g.set(e,i=[]),i.push(r),this.h+=1,this},e.forEach=function(e,r){U(this),this.g.forEach((function(i,s){i.forEach((function(i){e.call(r,i,s,this)}),this)}),this)},e.set=function(e,r){return U(this),this.i=null,zc(this,e=V(this,e))&&(this.h-=this.g.get(e).length),this.g.set(e,[r]),this.h+=1,this},e.get=function(e,r){return e&&(e=Ac(this,e)).length>0?String(e[0]):r},e.toString=function(){if(this.i)return this.i;if(!this.g)return"";const e=[],r=Array.from(this.g.keys());for(let s=0;s<r.length;s++){var i=r[s];const o=L(i);i=Ac(this,i);for(let r=0;r<i.length;r++){let s=o;""!==i[r]&&(s+="="+L(i[r])),e.push(s)}}return this.i=e.join("&")},t(Ec,eb),Ec.prototype.g=function(){return new Fc(this.i,this.h)},t(Fc,C),(e=Fc.prototype).open=function(e,r){if(0!=this.readyState)throw this.abort(),Error("Error reopening a connection");this.F=e,this.D=r,this.readyState=1,Gc(this)},e.send=function(e){if(1!=this.readyState)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const r={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};e&&(r.body=e),(this.H||o).fetch(new Request(this.D,r)).then(this.Pa.bind(this),this.ga.bind(this))},e.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch((()=>{})),this.readyState>=1&&this.g&&4!=this.readyState&&(this.g=!1,Hc(this)),this.readyState=0},e.Pa=function(e){if(this.g&&(this.l=e,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=e.headers,this.readyState=2,Gc(this)),this.g&&(this.readyState=3,Gc(this),this.g)))if("arraybuffer"===this.responseType)e.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(void 0!==o.ReadableStream&&"body"in e){if(this.j=e.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Ic(this)}else e.text().then(this.Oa.bind(this),this.ga.bind(this))},e.Ma=function(e){if(this.g){if(this.o&&e.value)this.response.push(e.value);else if(!this.o){var r=e.value?e.value:new Uint8Array(0);(r=this.B.decode(r,{stream:!e.done}))&&(this.response=this.responseText+=r)}e.done?Hc(this):Gc(this),3==this.readyState&&Ic(this)}},e.Oa=function(e){this.g&&(this.response=this.responseText=e,Hc(this))},e.Na=function(e){this.g&&(this.response=e,Hc(this))},e.ga=function(){this.g&&Hc(this)},e.setRequestHeader=function(e,r){this.A.append(e,r)},e.getResponseHeader=function(e){return this.h&&this.h.get(e.toLowerCase())||""},e.getAllResponseHeaders=function(){if(!this.h)return"";const e=[],r=this.h.entries();for(var i=r.next();!i.done;)i=i.value,e.push(i[0]+": "+i[1]),i=r.next();return e.join("\r\n")},Object.defineProperty(Fc.prototype,"withCredentials",{get:function(){return"include"===this.m},set:function(e){this.m=e?"include":"same-origin"}}),t(X,C);var ve=/^https?$/i,De=["POST","PUT"];function Nc(e,r){e.h=!1,e.g&&(e.j=!0,e.g.abort(),e.j=!1),e.l=r,e.o=5,Oc(e),Pc(e)}function Oc(e){e.A||(e.A=!0,D(e,"complete"),D(e,"error"))}function Qc(e){if(e.h&&void 0!==s)if(e.v&&4==P(e))setTimeout(e.Ca.bind(e),0);else if(D(e,"readystatechange"),4==P(e)){e.h=!1;try{const s=e.ca();e:switch(s){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var r=!0;break e;default:r=!1}var i;if(!(i=r)){var _;if(_=0===s){let r=String(e.D).match(Re)[1]||null;!r&&o.self&&o.self.location&&(r=o.self.location.protocol.slice(0,-1)),_=!ve.test(r?r.toLowerCase():"")}i=_}if(i)D(e,"complete"),D(e,"success");else{e.o=6;try{var h=P(e)>2?e.g.statusText:""}catch(e){h=""}e.l=h+" ["+e.ca()+"]",Oc(e)}}finally{Pc(e)}}}function Pc(e,r){if(e.g){e.m&&(clearTimeout(e.m),e.m=null);const i=e.g;e.g=null,r||D(e,"ready");try{i.onreadystatechange=null}catch(e){}}}function P(e){return e.g?e.g.readyState:0}function Ib(e){try{if(!e.g)return null;if("response"in e.g)return e.g.response;switch(e.F){case"":case"text":return e.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in e.g)return e.g.mozResponseArrayBuffer}return null}catch(e){return null}}function Rc(e,r,i){return i&&i.internalChannelParams&&i.internalChannelParams[e]||r}function Sc(e){this.za=0,this.i=[],this.j=new pb,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Rc("failFast",!1,e),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Rc("baseRetryDelayMs",5e3,e),this.Za=Rc("retryDelaySeedMs",1e4,e),this.Ta=Rc("forwardChannelMaxRetries",2,e),this.va=Rc("forwardChannelRequestTimeoutMs",2e4,e),this.ma=e&&e.xmlHttpFactory||void 0,this.Ua=e&&e.Rb||void 0,this.Aa=e&&e.useFetchStreams||!1,this.O=void 0,this.L=e&&e.supportsCrossDomainXhr||!1,this.M="",this.h=new ec(e&&e.concurrentRequestLimit),this.Ba=new Dc,this.S=e&&e.fastHandshake||!1,this.R=e&&e.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=e&&e.Pb||!1,e&&e.ua&&this.j.ua(),e&&e.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&e&&e.detectBufferingProxy||!1,this.ia=void 0,e&&e.longPollingTimeout&&e.longPollingTimeout>0&&(this.ia=e.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}function cc(e){if(Tc(e),3==e.I){var r=e.V++,i=O(e.J);if(S(i,"SID",e.M),S(i,"RID",r),S(i,"TYPE","terminate"),Uc(e,i),(r=new N(e,e.j,r)).M=2,r.A=Db(O(i)),i=!1,o.navigator&&o.navigator.sendBeacon)try{i=o.navigator.sendBeacon(r.A.toString(),"")}catch(e){}!i&&o.Image&&((new Image).src=r.A,i=!0),i||(r.g=Hb(r.j,null),r.g.ea(r.A)),r.F=Date.now(),Fb(r)}Vc(e)}function Vb(e){e.g&&(Pb(e),e.g.cancel(),e.g=null)}function Tc(e){Vb(e),e.v&&(o.clearTimeout(e.v),e.v=null),Ub(e),e.h.cancel(),e.m&&("number"==typeof e.m&&o.clearTimeout(e.m),e.m=null)}function bc(e){if(!fc(e.h)&&!e.m){e.m=!0;var r=e.Ea;d||ta(),f||(d(),f=!0),g.add(r,e),e.D=0}}function Zc(e,r){var i;i=r?r.l:e.V++;const s=O(e.J);S(s,"SID",e.M),S(s,"RID",i),S(s,"AID",e.K),Uc(e,s),e.u&&e.o&&Kc(s,e.u,e.o),i=new N(e,e.j,i,e.D+1),null===e.u&&(i.J=e.o),r&&(e.i=r.G.concat(e.i)),r=Yc(e,i,1e3),i.H=Math.round(.5*e.va)+Math.round(.5*e.va*Math.random()),Yb(e.h,i),Cb(i,s,r)}function Uc(e,r){e.H&&ya(e.H,(function(e,i){S(r,i,e)})),e.l&&ya({},(function(e,i){S(r,i,e)}))}function Yc(e,r,i){i=Math.min(e.i.length,i);const s=e.l?p(e.l.Ka,e.l,e):null;e:{var o=e.i;let r=-1;for(;;){const e=["count="+i];-1==r?i>0?(r=o[0].g,e.push("ofs="+r)):r=0:e.push("ofs="+r);let d=!0;for(let f=0;f<i;f++){var _=o[f].g;const i=o[f].map;if((_-=r)<0)r=Math.max(0,o[f].g-100),d=!1;else try{_="req"+_+"_"||"";try{var h=i instanceof Map?i:Object.entries(i);for(const[r,i]of h){let s=i;n(i)&&(s=_e(i)),e.push(_+r+"="+encodeURIComponent(s))}}catch(r){throw e.push(_+"type="+encodeURIComponent("_badmap")),r}}catch(e){s&&s(i)}}if(d){h=e.join("&");break e}}h=void 0}return e=e.i.splice(0,i),r.G=e,h}function ac(e){if(!e.g&&!e.v){e.Y=1;var r=e.Da;d||ta(),f||(d(),f=!0),g.add(r,e),e.A=0}}function Wb(e){return!(e.g||e.v||e.A>=3)&&(e.Y++,e.v=ob(p(e.Da,e),Xc(e,e.A)),e.A++,!0)}function Pb(e){null!=e.B&&(o.clearTimeout(e.B),e.B=null)}function $c(e){e.g=new N(e,e.j,"rpc",e.Y),null===e.u&&(e.g.J=e.o),e.g.P=0;var r=O(e.na);S(r,"RID","rpc"),S(r,"SID",e.M),S(r,"AID",e.K),S(r,"CI",e.F?"0":"1"),!e.F&&e.ia&&S(r,"TO",e.ia),S(r,"TYPE","xmlhttp"),Uc(e,r),e.u&&e.o&&Kc(r,e.u,e.o),e.O&&(e.g.H=e.O);var i=e.g;e=e.ba,i.M=1,i.A=Db(O(r)),i.u=null,i.R=!0,Eb(i,e)}function Ub(e){null!=e.C&&(o.clearTimeout(e.C),e.C=null)}function Qb(e,r){var i=null;if(e.g==r){Ub(e),Pb(e),e.g=null;var s=2}else{if(!Tb(e.h,r))return;i=r.G,$b(e.h,r),s=1}if(0!=e.I)if(r.o)if(1==s){i=r.u?r.u.length:0,r=Date.now()-r.F;var o=e.D;D(s=jb(),new nb(s,i)),bc(e)}else ac(e);else if(3==(o=r.m)||0==o&&r.X>0||!(1==s&&function Wc(e,r){return!(Xb(e.h)>=e.h.j-(e.m?1:0)||(e.m?(e.i=r.G.concat(e.i),0):1==e.I||2==e.I||e.D>=(e.Sa?0:e.Ta)||(e.m=ob(p(e.Ea,e,r),Xc(e,e.D)),e.D++,0)))}(e,r)||2==s&&Wb(e)))switch(i&&i.length>0&&(r=e.h,r.i=r.i.concat(i)),o){case 1:R(e,5);break;case 4:R(e,10);break;case 3:R(e,6);break;default:R(e,2)}}function Xc(e,r){let i=e.Qa+Math.floor(Math.random()*e.Za);return e.isActive()||(i*=2),i*r}function R(e,r){if(e.j.info("Error code "+r),2==r){var i=p(e.bb,e),s=e.Ua;const r=!s;s=new T(s||"//www.google.com/images/cleardot.gif"),o.location&&"http"==o.location.protocol||kc(s,"https"),Db(s),r?function Bc(e,r){const i=new pb;if(o.Image){const s=new Image;s.onload=ha(W,i,"TestLoadImage: loaded",!0,r,s),s.onerror=ha(W,i,"TestLoadImage: error",!1,r,s),s.onabort=ha(W,i,"TestLoadImage: abort",!1,r,s),s.ontimeout=ha(W,i,"TestLoadImage: timeout",!1,r,s),o.setTimeout((function(){s.ontimeout&&s.ontimeout()}),1e4),s.src=e}else r(!1)}(s.toString(),i):function Cc(e,r){new pb;const i=new AbortController,s=setTimeout((()=>{i.abort(),W(0,0,!1,r)}),1e4);fetch(e,{signal:i.signal}).then((e=>{clearTimeout(s),e.ok?W(0,0,!0,r):W(0,0,!1,r)})).catch((()=>{clearTimeout(s),W(0,0,!1,r)}))}(s.toString(),i)}else J(2);e.I=0,e.l&&e.l.pa(r),Vc(e),Tc(e)}function Vc(e){if(e.I=0,e.ja=[],e.l){const r=hc(e.h);0==r.length&&0==e.i.length||(ka(e.ja,r),ka(e.ja,e.i),e.h.i.length=0,ja(e.i),e.i.length=0),e.l.oa()}}function Zb(e,r,i){var s=i instanceof T?O(i):new T(i);if(""!=s.g)r&&(s.g=r+"."+s.g),lc(s,s.u);else{var _=o.location;s=_.protocol,r=r?r+"."+_.hostname:_.hostname,_=+_.port;const e=new T(null);s&&kc(e,s),r&&(e.g=r),_&&lc(e,_),i&&(e.h=i),s=e}return i=e.G,r=e.wa,i&&r&&S(s,i,r),S(s,"VER",e.ka),Uc(e,s),s}function Hb(e,r,i){if(r&&!e.L)throw Error("Can't create secondary domain capable XhrIo object.");return(r=e.Aa&&!e.ma?new X(new Ec({ab:i})):new X(e.ma)).Fa(e.L),r}function ad(){}function bd(){}function Y(e,r){C.call(this),this.g=new Sc(r),this.l=e,this.h=r&&r.messageUrlParams||null,e=r&&r.messageHeaders||null,r&&r.clientProtocolHeaderRequired&&(e?e["X-Client-Protocol"]="webchannel":e={"X-Client-Protocol":"webchannel"}),this.g.o=e,e=r&&r.initMessageHeaders||null,r&&r.messageContentType&&(e?e["X-WebChannel-Content-Type"]=r.messageContentType:e={"X-WebChannel-Content-Type":r.messageContentType}),r&&r.sa&&(e?e["X-WebChannel-Client-Profile"]=r.sa:e={"X-WebChannel-Client-Profile":r.sa}),this.g.U=e,(e=r&&r.Qb)&&!y(e)&&(this.g.u=e),this.A=r&&r.supportsCrossDomainXhr||!1,this.v=r&&r.sendRawJson||!1,(r=r&&r.httpSessionIdParam)&&!y(r)&&(this.g.G=r,null!==(e=this.h)&&r in e&&(r in(e=this.h)&&delete e[r])),this.j=new Z(this)}function cd(e){gb.call(this),e.__headers__&&(this.headers=e.__headers__,this.statusCode=e.__status__,delete e.__headers__,delete e.__status__);var r=e.__sm__;if(r){e:{for(const i in r){e=i;break e}e=void 0}(this.i=e)&&(e=this.i,r=null!==r&&e in r?r[e]:void 0),this.data=r}else this.data=e}function dd(){hb.call(this),this.status=1}function Z(e){this.g=e}(e=X.prototype).Fa=function(e){this.H=e},e.ea=function(e,r,i,s){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+e);r=r?r.toUpperCase():"GET",this.D=e,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():pe.g(),this.g.onreadystatechange=_(p(this.Ca,this));try{this.B=!0,this.g.open(r,String(e),!0),this.B=!1}catch(e){return void Nc(this,e)}if(e=i||"",i=new Map(this.headers),s)if(Object.getPrototypeOf(s)===Object.prototype)for(var h in s)i.set(h,s[h]);else{if("function"!=typeof s.keys||"function"!=typeof s.get)throw Error("Unknown input type for opt_headers: "+String(s));for(const e of s.keys())i.set(e,s.get(e))}s=Array.from(i.keys()).find((e=>"content-type"==e.toLowerCase())),h=o.FormData&&e instanceof o.FormData,!(Array.prototype.indexOf.call(De,r,void 0)>=0)||s||h||i.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[e,r]of i)this.g.setRequestHeader(e,r);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(e),this.v=!1}catch(e){Nc(this,e)}},e.abort=function(e){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=e||7,D(this,"complete"),D(this,"abort"),Pc(this))},e.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Pc(this,!0)),X.Z.N.call(this)},e.Ca=function(){this.u||(this.B||this.v||this.j?Qc(this):this.Xa())},e.Xa=function(){Qc(this)},e.isActive=function(){return!!this.g},e.ca=function(){try{return P(this)>2?this.g.status:-1}catch(e){return-1}},e.la=function(){try{return this.g?this.g.responseText:""}catch(e){return""}},e.La=function(e){if(this.g){var r=this.g.responseText;return e&&0==r.indexOf(e)&&(r=r.substring(e.length)),he(r)}},e.ya=function(){return this.o},e.Ha=function(){return"string"==typeof this.l?this.l:String(this.l)},(e=Sc.prototype).ka=8,e.I=1,e.connect=function(e,r,i,s){J(0),this.W=e,this.H=r||{},i&&void 0!==s&&(this.H.OSID=i,this.H.OAID=s),this.F=this.X,this.J=Zb(this,null,this.W),bc(this)},e.Ea=function(e){if(this.m)if(this.m=null,1==this.I){if(!e){this.V=Math.floor(1e5*Math.random()),e=this.V++;const o=new N(this,this.j,e);let _=this.o;if(this.U&&(_?(_=Ba(_),Da(_,this.U)):_=this.U),null!==this.u||this.R||(o.J=_,_=null),this.S)e:{for(var r=0,i=0;i<this.i.length;i++){var s=this.i[i];if(void 0===(s="__data__"in s.map&&"string"==typeof(s=s.map.__data__)?s.length:void 0))break;if((r+=s)>4096){r=i;break e}if(4096===r||i===this.i.length-1){r=i+1;break e}}r=1e3}else r=1e3;r=Yc(this,o,r),S(i=O(this.J),"RID",e),S(i,"CVER",22),this.G&&S(i,"X-HTTP-Session-Id",this.G),Uc(this,i),_&&(this.R?r="headers="+L(Jc(_))+"&"+r:this.u&&Kc(i,this.u,_)),Yb(this.h,o),this.Ra&&S(i,"TYPE","init"),this.S?(S(i,"$req",r),S(i,"SID","null"),o.U=!0,Cb(o,i,null)):Cb(o,i,r),this.I=2}}else 3==this.I&&(e?Zc(this,e):0==this.i.length||fc(this.h)||Zc(this))},e.Da=function(){if(this.v=null,$c(this),this.aa&&!(this.P||null==this.g||this.T<=0)){var e=4*this.T;this.j.info("BP detection timer enabled: "+e),this.B=ob(p(this.Wa,this),e)}},e.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,J(10),Vb(this),$c(this))},e.Va=function(){null!=this.C&&(this.C=null,Vb(this),Wb(this),J(19))},e.bb=function(e){e?(this.j.info("Successfully pinged google.com"),J(2)):(this.j.info("Failed to ping google.com"),J(1))},e.isActive=function(){return!!this.l&&this.l.isActive(this)},(e=ad.prototype).ra=function(){},e.qa=function(){},e.pa=function(){},e.oa=function(){},e.isActive=function(){return!0},e.Ka=function(){},bd.prototype.g=function(e,r){return new Y(e,r)},t(Y,C),Y.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},Y.prototype.close=function(){cc(this.g)},Y.prototype.o=function(e){var r=this.g;if("string"==typeof e){var i={};i.__data__=e,e=i}else this.v&&((i={}).__data__=_e(e),e=i);r.i.push(new Ae(r.Ya++,e)),3==r.I&&bc(r)},Y.prototype.N=function(){this.g.l=null,delete this.j,cc(this.g),delete this.g,Y.Z.N.call(this)},t(cd,gb),t(dd,hb),t(Z,ad),Z.prototype.ra=function(){D(this.g,"a")},Z.prototype.qa=function(e){D(this.g,new cd(e))},Z.prototype.pa=function(e){D(this.g,new dd)},Z.prototype.oa=function(){D(this.g,"b")},bd.prototype.createWebChannel=bd.prototype.g,Y.prototype.send=Y.prototype.o,Y.prototype.open=Y.prototype.m,Y.prototype.close=Y.prototype.close,ce=function(){return new bd},ae=function(){return jb()},oe=fe,se={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Ie.NO_ERROR=0,Ie.TIMEOUT=8,Ie.HTTP_ERROR=6,ie=Ie,Te.COMPLETE="complete",re=Te,fb.EventType=me,me.OPEN="a",me.CLOSE="b",me.ERROR="c",me.MESSAGE="d",C.prototype.listen=C.prototype.J,ne=fb,X.prototype.listenOnce=X.prototype.K,X.prototype.getLastError=X.prototype.Ha,X.prototype.getLastErrorCode=X.prototype.ya,X.prototype.getStatus=X.prototype.ca,X.prototype.getResponseJson=X.prototype.La,X.prototype.getResponseText=X.prototype.la,X.prototype.send=X.prototype.ea,X.prototype.setWithCredentials=X.prototype.Fa,te=X}).apply(void 0!==ue?ue:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});class User{constructor(e){this.uid=e}isAuthenticated(){return null!=this.uid}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}User.UNAUTHENTICATED=new User(null),User.GOOGLE_CREDENTIALS=new User("google-credentials-uid"),User.FIRST_PARTY=new User("first-party-uid"),User.MOCK_USER=new User("mock-user");let le="12.10.0";const _e=new class Logger{constructor(e){this.name=e,this._logLevel=$,this._logHandler=defaultLogHandler,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in M))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel="string"==typeof e?j[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if("function"!=typeof e)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,M.DEBUG,...e),this._logHandler(this,M.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,M.VERBOSE,...e),this._logHandler(this,M.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,M.INFO,...e),this._logHandler(this,M.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,M.WARN,...e),this._logHandler(this,M.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,M.ERROR,...e),this._logHandler(this,M.ERROR,...e)}}("@firebase/firestore");function __PRIVATE_getLogLevel(){return _e.logLevel}function setLogLevel(e){_e.setLogLevel(e)}function __PRIVATE_logDebug(e,...r){if(_e.logLevel<=M.DEBUG){const i=r.map(__PRIVATE_argToString);_e.debug(`Firestore (${le}): ${e}`,...i)}}function __PRIVATE_logError(e,...r){if(_e.logLevel<=M.ERROR){const i=r.map(__PRIVATE_argToString);_e.error(`Firestore (${le}): ${e}`,...i)}}function __PRIVATE_logWarn(e,...r){if(_e.logLevel<=M.WARN){const i=r.map(__PRIVATE_argToString);_e.warn(`Firestore (${le}): ${e}`,...i)}}function __PRIVATE_argToString(e){if("string"==typeof e)return e;try{return function __PRIVATE_formatJSON(e){return JSON.stringify(e)}(e)}catch(r){return e}}function fail(e,r,i){let s="Unexpected state";"string"==typeof r?s=r:i=r,__PRIVATE__fail(e,s,i)}function __PRIVATE__fail(e,r,i){let s=`FIRESTORE (${le}) INTERNAL ASSERTION FAILED: ${r} (ID: ${e.toString(16)})`;if(void 0!==i)try{s+=" CONTEXT: "+JSON.stringify(i)}catch(e){s+=" CONTEXT: "+i}throw __PRIVATE_logError(s),new Error(s)}function __PRIVATE_hardAssert(e,r,i,s){let o="Unexpected state";"string"==typeof i?o=i:s=i,e||__PRIVATE__fail(r,o,s)}function __PRIVATE_debugAssert(e,r){e||fail(57014,r)}function __PRIVATE_debugCast(e,r){return e}const he={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIE
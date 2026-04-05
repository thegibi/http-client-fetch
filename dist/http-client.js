"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = exports.HttpClientHeaders = exports.HttpClientError = exports.HttpStatusCode = void 0;
var HttpStatusCode;
(function (HttpStatusCode) {
    HttpStatusCode[HttpStatusCode["Ok"] = 200] = "Ok";
    HttpStatusCode[HttpStatusCode["Created"] = 201] = "Created";
    HttpStatusCode[HttpStatusCode["Accepted"] = 202] = "Accepted";
    HttpStatusCode[HttpStatusCode["NoContent"] = 204] = "NoContent";
    HttpStatusCode[HttpStatusCode["BadRequest"] = 400] = "BadRequest";
    HttpStatusCode[HttpStatusCode["Unauthorized"] = 401] = "Unauthorized";
    HttpStatusCode[HttpStatusCode["Forbidden"] = 403] = "Forbidden";
    HttpStatusCode[HttpStatusCode["NotFound"] = 404] = "NotFound";
    HttpStatusCode[HttpStatusCode["InternalServerError"] = 500] = "InternalServerError";
    HttpStatusCode[HttpStatusCode["BadGateway"] = 502] = "BadGateway";
    HttpStatusCode[HttpStatusCode["ServiceUnavailable"] = 503] = "ServiceUnavailable";
})(HttpStatusCode || (exports.HttpStatusCode = HttpStatusCode = {}));
class HttpClientError extends Error {
    code;
    config;
    request;
    response;
    isHttpClientError = true;
    constructor(message, code, config, request, response) {
        super(message);
        this.code = code;
        this.config = config;
        this.request = request;
        this.response = response;
        Object.setPrototypeOf(this, HttpClientError.prototype);
    }
}
exports.HttpClientError = HttpClientError;
class HttpClientHeaders {
    storage = new Map();
    constructor(headers) {
        if (headers)
            this.set(headers);
    }
    set(headerName, value) {
        if (typeof headerName === 'object' && headerName !== null) {
            Object.entries(headerName).forEach(([k, v]) => this.storage.set(k.toLowerCase(), v));
        }
        else if (typeof headerName === 'string') {
            this.storage.set(headerName.toLowerCase(), value);
        }
        return this;
    }
    toJSON() {
        return Object.fromEntries(this.storage);
    }
    has(headerName) {
        return this.storage.has(headerName.toLowerCase());
    }
}
exports.HttpClientHeaders = HttpClientHeaders;
class InterceptorManager {
    handlers = [];
    use(fulfilled, rejected) {
        this.handlers.push({ fulfilled, rejected });
        return this.handlers.length - 1;
    }
    eject(id) {
        if (this.handlers[id])
            this.handlers[id] = null;
    }
    forEach(fn) {
        this.handlers.forEach((h) => h && fn(h));
    }
}
class HttpClient {
    defaults = {
        timeout: 0,
        headers: {
            common: { Accept: 'application/json, text/plain, */*' },
            get: {},
            head: {},
            options: {},
            post: {},
            put: {},
            patch: {},
            delete: {},
        },
    };
    interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager(),
    };
    constructor(config) {
        if (config) {
            this.defaults = this.mergeConfig(this.defaults, config);
        }
    }
    async request(urlOrConfig, config) {
        const requestConfig = typeof urlOrConfig === 'string'
            ? { ...(config || {}), url: urlOrConfig }
            : urlOrConfig || {};
        const conf = this.mergeConfig(this.defaults, requestConfig);
        const method = (conf.method || 'get').toLowerCase();
        const headers = new HttpClientHeaders(conf.headers?.common)
            .set(conf.headers?.[method])
            .set(requestConfig.headers)
            .toJSON();
        conf.method = method;
        conf.headers = headers;
        if (!conf.url) {
            throw new HttpClientError('Missing request URL', 'ERR_INVALID_URL', conf);
        }
        let chain = [this.dispatchRequest.bind(this), undefined];
        this.interceptors.request.forEach((i) => chain.unshift(i.fulfilled, i.rejected));
        this.interceptors.response.forEach((i) => chain.push(i.fulfilled, i.rejected));
        let promise = Promise.resolve(conf);
        while (chain.length) {
            promise = promise.then(chain.shift(), chain.shift());
        }
        return promise;
    }
    mergeConfig(defaults, config) {
        return {
            ...defaults,
            ...config,
            headers: {
                ...(defaults.headers || {}),
                ...(config.headers || {}),
            },
        };
    }
    createTimeoutSignal(timeout) {
        if (!timeout || timeout <= 0) {
            return {
                signal: undefined,
                clear: () => undefined,
                timedOut: () => false,
            };
        }
        const controller = new AbortController();
        let didTimeout = false;
        const timer = setTimeout(() => {
            didTimeout = true;
            controller.abort();
        }, timeout);
        return {
            signal: controller.signal,
            clear: () => clearTimeout(timer),
            timedOut: () => didTimeout,
        };
    }
    combineSignals(signalA, signalB) {
        if (!signalA) {
            return signalB;
        }
        if (!signalB) {
            return signalA;
        }
        const controller = new AbortController();
        const abort = () => controller.abort();
        if (signalA.aborted || signalB.aborted) {
            controller.abort();
            return controller.signal;
        }
        signalA.addEventListener('abort', abort, { once: true });
        signalB.addEventListener('abort', abort, { once: true });
        return controller.signal;
    }
    shouldSerializeJsonBody(data) {
        if (data == null) {
            return false;
        }
        if (typeof data !== 'object') {
            return false;
        }
        return (!(typeof FormData !== 'undefined' && data instanceof FormData) &&
            !(data instanceof URLSearchParams) &&
            !(data instanceof Blob) &&
            !(data instanceof ArrayBuffer));
    }
    async parseResponseData(response) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return response.json().catch(() => null);
        }
        return response.text().catch(() => null);
    }
    headersToObject(headers) {
        const result = {};
        headers.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }
    async dispatchRequest(config) {
        const { url, method, data, headers, params, baseURL, signal, timeout } = config;
        // Build URL with baseURL and query params
        let fullUrl = baseURL ? new URL(url, baseURL).toString() : url;
        if (params) {
            const searchParams = new URLSearchParams(params);
            fullUrl += (fullUrl.includes('?') ? '&' : '?') + searchParams.toString();
        }
        const timeoutControl = this.createTimeoutSignal(timeout);
        const requestSignal = this.combineSignals(signal, timeoutControl.signal);
        const normalizedHeaders = new HttpClientHeaders(headers);
        const upperMethod = method?.toUpperCase() || 'GET';
        let body = data;
        if (this.shouldSerializeJsonBody(data)) {
            body = JSON.stringify(data);
            if (!normalizedHeaders.has('content-type')) {
                normalizedHeaders.set('Content-Type', 'application/json');
            }
        }
        if (upperMethod === 'GET' || upperMethod === 'HEAD') {
            body = undefined;
        }
        try {
            const response = await fetch(fullUrl, {
                method: upperMethod,
                headers: normalizedHeaders.toJSON(),
                body,
                signal: requestSignal,
            });
            timeoutControl.clear();
            const responseData = await this.parseResponseData(response);
            const result = {
                data: responseData,
                status: response.status,
                statusText: response.statusText,
                headers: this.headersToObject(response.headers),
                config,
            };
            if (!response.ok) {
                throw new HttpClientError('Request failed', 'ERR_BAD_RESPONSE', config, null, result);
            }
            return result;
        }
        catch (err) {
            timeoutControl.clear();
            if (err.name === 'AbortError') {
                const code = timeoutControl.timedOut()
                    ? 'ECONNABORTED'
                    : 'ERR_CANCELED';
                const message = timeoutControl.timedOut()
                    ? `timeout of ${timeout}ms exceeded`
                    : 'Request aborted';
                throw new HttpClientError(message, code, config);
            }
            if (err instanceof TypeError) {
                throw new HttpClientError('Network Error', 'ERR_NETWORK', config, err);
            }
            throw err;
        }
    }
    get(url, config) {
        return this.request({ ...config, url, method: 'get' });
    }
    head(url, config) {
        return this.request({ ...config, url, method: 'head' });
    }
    options(url, config) {
        return this.request({ ...config, url, method: 'options' });
    }
    post(url, data, config) {
        return this.request({ ...config, url, data, method: 'post' });
    }
    put(url, data, config) {
        return this.request({ ...config, url, data, method: 'put' });
    }
    patch(url, data, config) {
        return this.request({ ...config, url, data, method: 'patch' });
    }
    delete(url, config) {
        return this.request({ ...config, url, method: 'delete' });
    }
}
exports.HttpClient = HttpClient;
const createInstance = (config) => {
    const context = new HttpClient(config);
    const instance = context.request.bind(context);
    Object.assign(instance, context);
    Object.setPrototypeOf(instance, HttpClient.prototype);
    return instance;
};
const httpClient = createInstance();
httpClient.create = createInstance;
httpClient.HttpClientError = HttpClientError;
exports.default = httpClient;
//# sourceMappingURL=http-client.js.map
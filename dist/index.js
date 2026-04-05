"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const _http_client_1 = __importStar(require("./http-client"));
const api = _http_client_1.default.create({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 5000,
    headers: {
        'X-Custom-Header': 'MyClient',
    },
});
api.interceptors.request.use((config) => {
    console.log(`[Request] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`);
    config.headers = config.headers || {};
    config.headers.Authorization = 'Bearer TOKEN_123';
    return config;
});
api.interceptors.response.use((response) => {
    console.log(`[Response] ${response.status} ${response.statusText}`);
    return response;
}, (error) => {
    if (error.response?.status === _http_client_1.HttpStatusCode.Unauthorized) {
        console.error('Authentication error');
    }
    return Promise.reject(error);
});
async function run() {
    try {
        // Axios-style usage: helper method
        const post = await api.get('/posts/1');
        console.log('Post title:', post.data?.title);
        // Axios-style usage: instance(url, config)
        const comments = await api('/comments', {
            method: 'GET',
            params: { postId: 1 },
        });
        console.log('Returned comments:', comments.data?.length ?? 0);
        // Axios-style usage: request(url, config)
        const created = await api.request('/posts', {
            method: 'POST',
            data: {
                title: 'New Post',
                body: 'Post content sent via httpClient',
                userId: 1,
            },
        });
        console.log('Post created:', created.status === _http_client_1.HttpStatusCode.Created);
    }
    catch (error) {
        if (error instanceof _http_client_1.HttpClientError || error?.isHttpClientError) {
            console.error('HTTP error:', error.message, 'code=', error.code, 'status=', error.response?.status);
            return;
        }
        console.error('Unexpected error:', error);
    }
}
run();
//# sourceMappingURL=index.js.map
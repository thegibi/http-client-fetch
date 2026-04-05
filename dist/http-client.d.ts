export type Method = 'get' | 'GET' | 'delete' | 'DELETE' | 'head' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH';
export interface HttpHeaders {
    [header: string]: string | number | boolean;
}
export interface HttpClientRequestConfig<D = any> {
    url?: string;
    method?: Method;
    baseURL?: string;
    headers?: Record<string, string | number | boolean>;
    params?: Record<string, any>;
    data?: D;
    timeout?: number;
    signal?: AbortSignal;
}
export interface HttpClientResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: HttpClientRequestConfig;
}
export interface HttpClientInterceptorManager<V> {
    use(onFulfilled?: (value: V) => V | Promise<V>, onRejected?: (error: any) => any): number;
    eject(id: number): void;
}
export declare enum HttpStatusCode {
    Ok = 200,
    Created = 201,
    Accepted = 202,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    InternalServerError = 500,
    BadGateway = 502,
    ServiceUnavailable = 503
}
export declare class HttpClientError<T = unknown, D = any> extends Error {
    code?: string | undefined;
    config?: HttpClientRequestConfig<D> | undefined;
    request?: any | undefined;
    response?: HttpClientResponse<T> | undefined;
    isHttpClientError: boolean;
    constructor(message?: string, code?: string | undefined, config?: HttpClientRequestConfig<D> | undefined, request?: any | undefined, response?: HttpClientResponse<T> | undefined);
}
export declare class HttpClientHeaders {
    private storage;
    constructor(headers?: any);
    set(headerName: any, value?: any): HttpClientHeaders;
    toJSON(): {
        [k: string]: any;
    };
    has(headerName: string): boolean;
}
declare class InterceptorManager<V> {
    private handlers;
    use(fulfilled: any, rejected?: any): number;
    eject(id: number): void;
    forEach(fn: (handler: any) => void): void;
}
export declare class HttpClient {
    defaults: any;
    interceptors: {
        request: InterceptorManager<any>;
        response: InterceptorManager<any>;
    };
    constructor(config?: any);
    request<T = any>(urlOrConfig: any, config?: any): Promise<any>;
    private mergeConfig;
    private createTimeoutSignal;
    private combineSignals;
    private shouldSerializeJsonBody;
    private parseResponseData;
    private headersToObject;
    private dispatchRequest;
    get(url: string, config?: any): Promise<any>;
    head(url: string, config?: any): Promise<any>;
    options(url: string, config?: any): Promise<any>;
    post(url: string, data?: any, config?: any): Promise<any>;
    put(url: string, data?: any, config?: any): Promise<any>;
    patch(url: string, data?: any, config?: any): Promise<any>;
    delete(url: string, config?: any): Promise<any>;
}
export interface HttpClientInstance {
    (config: HttpClientRequestConfig): Promise<HttpClientResponse>;
    (url: string, config?: HttpClientRequestConfig): Promise<HttpClientResponse>;
    defaults: any;
    interceptors: {
        request: HttpClientInterceptorManager<HttpClientRequestConfig>;
        response: HttpClientInterceptorManager<HttpClientResponse>;
    };
    request<T = any>(config: HttpClientRequestConfig): Promise<HttpClientResponse<T>>;
    request<T = any>(url: string, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>>;
    get<T = any>(url: string, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>>;
    delete<T = any>(url: string, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>>;
    post<T = any>(url: string, data?: any, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>>;
    head<T = any>(url: string, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>>;
    options<T = any>(url: string, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>>;
    put<T = any>(url: string, data?: any, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: HttpClientRequestConfig): Promise<HttpClientResponse<T>>;
    create(config?: HttpClientRequestConfig): HttpClientInstance;
    HttpClientError: typeof HttpClientError;
}
declare const httpClient: HttpClientInstance;
export default httpClient;
//# sourceMappingURL=http-client.d.ts.map
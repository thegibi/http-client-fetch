/**
 * Type definitions for Native HttpClient
 */

export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH';

export type HttpHeaderValue = string | number | boolean;

export type HttpHeadersMap = Record<string, HttpHeaderValue>;

export interface HttpClientHeadersDefaults {
  common: HttpHeadersMap;
  get?: HttpHeadersMap;
  head?: HttpHeadersMap;
  options?: HttpHeadersMap;
  post?: HttpHeadersMap;
  put?: HttpHeadersMap;
  patch?: HttpHeadersMap;
  delete?: HttpHeadersMap;
}

export interface HttpClientRequestConfig<D = any> {
  url?: string;
  method?: Method;
  baseURL?: string;
  headers?: HttpHeadersMap;
  params?: Record<string, any>;
  data?: D;
  timeout?: number;
  signal?: AbortSignal;
}

export interface HttpClientDefaults extends Omit<
  HttpClientRequestConfig,
  'headers'
> {
  headers: HttpClientHeadersDefaults;
}

export class HttpClientError<T = unknown, D = any> extends Error {
  isHttpClientError: boolean;
  constructor(
    message?: string,
    code?: string,
    config?: HttpClientRequestConfig<D>,
    request?: any,
    response?: HttpClientResponse<T>,
  );
}

export interface HttpClientResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: HttpClientRequestConfig;
}

export interface HttpClientInterceptorManager<V> {
  use(
    onFulfilled?: (value: V) => V | Promise<V>,
    onRejected?: (error: any) => any,
  ): number;
  eject(id: number): void;
}

export interface HttpClientInstance {
  (config: HttpClientRequestConfig): Promise<HttpClientResponse>;
  (url: string, config?: HttpClientRequestConfig): Promise<HttpClientResponse>;

  defaults: HttpClientDefaults;
  interceptors: {
    request: HttpClientInterceptorManager<HttpClientRequestConfig>;
    response: HttpClientInterceptorManager<HttpClientResponse>;
  };

  get<T = any>(
    url: string,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>>;
  delete<T = any>(
    url: string,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>>;
  post<T = any>(
    url: string,
    data?: any,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>>;
  head<T = any>(
    url: string,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>>;
  options<T = any>(
    url: string,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>>;
  put<T = any>(
    url: string,
    data?: any,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>>;
  patch<T = any>(
    url: string,
    data?: any,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>>;

  create(config?: HttpClientRequestConfig): HttpClientInstance;
  HttpClientError: typeof HttpClientError;
}

declare const httpClient: HttpClientInstance;
export default httpClient;

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
  use(
    onFulfilled?: (value: V) => V | Promise<V>,
    onRejected?: (error: any) => any,
  ): number;
  eject(id: number): void;
}

export enum HttpStatusCode {
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
  ServiceUnavailable = 503,
}

export class HttpClientError<T = unknown, D = any> extends Error {
  isHttpClientError = true;
  constructor(
    message?: string,
    public code?: string,
    public config?: HttpClientRequestConfig<D>,
    public request?: any,
    public response?: HttpClientResponse<T>,
  ) {
    super(message);
    Object.setPrototypeOf(this, HttpClientError.prototype);
  }
}

export class HttpClientHeaders {
  private storage = new Map<string, any>();

  constructor(headers?: any) {
    if (headers) this.set(headers);
  }

  set(headerName: any, value?: any): HttpClientHeaders {
    if (typeof headerName === 'object' && headerName !== null)
    {
      Object.entries(headerName).forEach(([k, v]) =>
        this.storage.set(k.toLowerCase(), v),
      );
    } else if (typeof headerName === 'string')
    {
      this.storage.set(headerName.toLowerCase(), value);
    }
    return this;
  }

  toJSON() {
    return Object.fromEntries(this.storage);
  }

  has(headerName: string): boolean {
    return this.storage.has(headerName.toLowerCase());
  }
}

class InterceptorManager<V> {
  private handlers: Array<{ fulfilled: any; rejected: any } | null> = [];

  use(fulfilled: any, rejected?: any): number {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  eject(id: number): void {
    if (this.handlers[id]) this.handlers[id] = null;
  }

  forEach(fn: (handler: any) => void) {
    this.handlers.forEach((h) => h && fn(h));
  }
}

export class HttpClient {
  defaults: any = {
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
    request: new InterceptorManager<any>(),
    response: new InterceptorManager<any>(),
  };

  constructor(config?: any) {
    if (config)
    {
      this.defaults = this.mergeConfig(this.defaults, config);
    }
  }

  async request<T = any>(urlOrConfig: any, config?: any): Promise<any> {
    const requestConfig =
      typeof urlOrConfig === 'string'
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

    if (!conf.url)
    {
      throw new HttpClientError('Missing request URL', 'ERR_INVALID_URL', conf);
    }

    let chain: any[] = [this.dispatchRequest.bind(this), undefined];

    this.interceptors.request.forEach((i) =>
      chain.unshift(i.fulfilled, i.rejected),
    );
    this.interceptors.response.forEach((i) =>
      chain.push(i.fulfilled, i.rejected),
    );

    let promise = Promise.resolve(conf);
    while (chain.length)
    {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }

  private mergeConfig(defaults: any, config: any): any {
    return {
      ...defaults,
      ...config,
      headers: {
        ...(defaults.headers || {}),
        ...(config.headers || {}),
      },
    };
  }

  private createTimeoutSignal(timeout?: number) {
    if (!timeout || timeout <= 0)
    {
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

  private combineSignals(signalA?: AbortSignal, signalB?: AbortSignal) {
    if (!signalA)
    {
      return signalB;
    }
    if (!signalB)
    {
      return signalA;
    }

    const controller = new AbortController();
    const abort = () => controller.abort();

    if (signalA.aborted || signalB.aborted)
    {
      controller.abort();
      return controller.signal;
    }

    signalA.addEventListener('abort', abort, { once: true });
    signalB.addEventListener('abort', abort, { once: true });

    return controller.signal;
  }

  private shouldSerializeJsonBody(data: any): boolean {
    if (data == null)
    {
      return false;
    }

    if (typeof data !== 'object')
    {
      return false;
    }

    return (
      !(typeof FormData !== 'undefined' && data instanceof FormData) &&
      !(data instanceof URLSearchParams) &&
      !(data instanceof Blob) &&
      !(data instanceof ArrayBuffer)
    );
  }

  private async parseResponseData(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json'))
    {
      return response.json().catch(() => null);
    }

    return response.text().catch(() => null);
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};

    headers.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  }

  private async dispatchRequest(config: any): Promise<any> {
    const { url, method, data, headers, params, baseURL, signal, timeout } =
      config;

    // Build URL with baseURL and query params
    let fullUrl = baseURL ? new URL(url, baseURL).toString() : url;
    if (params)
    {
      const searchParams = new URLSearchParams(params);
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + searchParams.toString();
    }

    const timeoutControl = this.createTimeoutSignal(timeout);
    const requestSignal = this.combineSignals(signal, timeoutControl.signal);

    const normalizedHeaders = new HttpClientHeaders(headers);
    const upperMethod = method?.toUpperCase() || 'GET';

    let body: any = data;
    if (this.shouldSerializeJsonBody(data))
    {
      body = JSON.stringify(data);
      if (!normalizedHeaders.has('content-type'))
      {
        normalizedHeaders.set('Content-Type', 'application/json');
      }
    }

    if (upperMethod === 'GET' || upperMethod === 'HEAD')
    {
      body = undefined;
    }

    try
    {
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

      if (!response.ok)
      {
        throw new HttpClientError(
          'Request failed',
          'ERR_BAD_RESPONSE',
          config,
          null,
          result,
        );
      }

      return result;
    } catch (err: any)
    {
      timeoutControl.clear();

      if (err.name === 'AbortError')
      {
        const code = timeoutControl.timedOut()
          ? 'ECONNABORTED'
          : 'ERR_CANCELED';
        const message = timeoutControl.timedOut()
          ? `timeout of ${timeout}ms exceeded`
          : 'Request aborted';
        throw new HttpClientError(message, code, config);
      }

      if (err instanceof TypeError)
      {
        throw new HttpClientError('Network Error', 'ERR_NETWORK', config, err);
      }

      throw err;
    }
  }

  get(url: string, config?: any) {
    return this.request({ ...config, url, method: 'get' });
  }
  head(url: string, config?: any) {
    return this.request({ ...config, url, method: 'head' });
  }
  options(url: string, config?: any) {
    return this.request({ ...config, url, method: 'options' });
  }
  post(url: string, data?: any, config?: any) {
    return this.request({ ...config, url, data, method: 'post' });
  }
  put(url: string, data?: any, config?: any) {
    return this.request({ ...config, url, data, method: 'put' });
  }
  patch(url: string, data?: any, config?: any) {
    return this.request({ ...config, url, data, method: 'patch' });
  }
  delete(url: string, config?: any) {
    return this.request({ ...config, url, method: 'delete' });
  }
}

const createInstance = (
  config?: HttpClientRequestConfig,
): HttpClientInstance => {
  const context = new HttpClient(config);
  const instance = context.request.bind(context) as any;
  Object.assign(instance, context);
  Object.setPrototypeOf(instance, HttpClient.prototype);
  return instance as HttpClientInstance;
};

export interface HttpClientInstance {
  (config: HttpClientRequestConfig): Promise<HttpClientResponse>;
  (url: string, config?: HttpClientRequestConfig): Promise<HttpClientResponse>;

  defaults: any;
  interceptors: {
    request: HttpClientInterceptorManager<HttpClientRequestConfig>;
    response: HttpClientInterceptorManager<HttpClientResponse>;
  };

  request<T = any>(
    config: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>>;
  request<T = any>(
    url: string,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>>;
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

const httpClient: HttpClientInstance = createInstance();
httpClient.create = createInstance;
httpClient.HttpClientError = HttpClientError;

export default httpClient;

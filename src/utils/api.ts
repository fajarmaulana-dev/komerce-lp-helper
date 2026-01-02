export type TPrimitive = string | number | boolean;

export type TProgress = {
  loaded: number;
  total: number;
  percentage: number;
};
export type TProgressCallback = (progress: TProgress) => void;

export type THttpConfig = {
  /** Optional request headers */
  headers?: Record<string, string>;
  /** Query parameters for the request */
  params?: Record<string, TPrimitive | TPrimitive[]>;
  /** Optional cache configuration */
  cache?: {
    /** Enable or disable caching for this request */
    enabled?: boolean;
    /** Cache revalidation time in milliseconds */
    revalidate?: number;
  };
  /** Abort signal to cancel the request */
  signal?: AbortSignal;
  /** Upload progress callback */
  onUpload?: TProgressCallback;
  /** Download progress callback */
  onDownload?: TProgressCallback;
};

export type TCacheEntry<T> = {
  /** Cached data */
  data: T;
  /** Timestamp when the data was cached */
  timestamp: number;
  /** Optional time-to-live (TTL) in milliseconds */
  ttl?: number;
};

export type TApiConfig = {
  /** Base URL of the API */
  baseURL?: string;
  /** Endpoint URL (relative or absolute) */
  url: string;
  /** HTTP method for the request */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Request body content */
  body?: globalThis.BodyInit;
  /** Request mode (e.g., 'cors', 'same-origin') */
  mode?: globalThis.RequestMode;
  /** Number of retry attempts on failure */
  retry?: number;
} & THttpConfig;

export type TApiInstanceOptions = {
  /** Base URL applied to all requests from this instance */
  baseURL?: string;
  /** Default headers applied to all requests */
  headers?: Record<string, string>;
  /** Source identifier used for cache scoping */
  source?: string;
  /** Maximum number of cache entries to store */
  maxCacheSize?: number;
};

export type TApiResponse<T> = {
  /** Parsed JSON data from the response */
  data: T;
  /** Unique key identifying this request (for caching) */
  cacheKey?: string;
  /** Indicates whether the data was served from cache */
  fromCache: boolean;
};

export interface IApiInterceptor {
  /**
   * Intercept and modify the request configuration before sending.
   * @param config{@link TApiConfig}: The outgoing request configuration
   */
  request?: (config: TApiConfig) => TApiConfig | Promise<TApiConfig>;

  /**
   * Intercept and modify the response before returning.
   * @param response The received Response object
   */
  response?: (response: Response) => Response | Promise<Response>;

  /**
   * Handle errors thrown during the request lifecycle.
   * @param error The thrown error object
   */
  error?: (error: unknown) => Promise<unknown>;
}
interface IApiInstance {
  /**
   * Registers custom interceptors for requests and responses.
   *
   * @param interceptors{@link IApiInterceptor}: Object containing optional `request`, `response`, and `error` interceptors.
   *
   * @example
   * ```ts
   * api.setInterceptors({
   *   request: config => ({ ...config, headers: { ...config.headers, Authorization: 'Bearer token' } }),
   *   response: response => response,
   *   error: error => Promise.reject(error),
   * })
   * ```
   */
  setInterceptors(interceptors: IApiInterceptor): void;

  /**
   * Sends a general API request with full configuration control.
   *
   * @template T - The expected response data type.
   * @param config{@link TApiConfig}: Full request configuration including URL, method, params, headers, etc.
   * @returns A promise that resolves to the API response.
   *
   * @example
   * ```ts
   * const res = await api.request<{ users: User[] }>({
   *   url: '/users',
   *   method: 'GET',
   *   cache: { enabled: true, revalidate: 5000 },
   * })
   * ```
   */
  request<T>(config: TApiConfig): Promise<TApiResponse<T>>;

  /**
   * Performs a GET request.
   *
   * @template T - The expected response data type.
   * @param url - The request URL.
   * @param config{@link TApiConfig}: Optional request configuration (headers, params, cache, etc).
   * @returns A promise resolving to the API response.
   *
   * @example
   * ```ts
   * const res = await api.get<User[]>('/users')
   * ```
   */
  get<T>(url: string, config?: THttpConfig): Promise<TApiResponse<T>>;

  /**
   * Performs a POST request.
   *
   * @template T - The expected response data type.
   * @param url - The request URL.
   * @param body - Optional request body.
   * @param config{@link TApiConfig}: Optional request configuration.
   * @returns A promise resolving to the API response.
   *
   * @example
   * ```ts
   * const res = await api.post<User>('/users', JSON.stringify({ name: 'John' }))
   * ```
   */
  post<T, U = unknown>(url: string, body?: U, config?: THttpConfig): Promise<TApiResponse<T>>;

  /**
   * Performs a PUT request.
   *
   * @template T - The expected response data type.
   * @param url - The request URL.
   * @param body - Optional request body.
   * @param config{@link TApiConfig}: Optional request configuration.
   * @returns A promise resolving to the API response.
   */
  put<T, U = unknown>(url: string, body?: U, config?: THttpConfig): Promise<TApiResponse<T>>;

  /**
   * Performs a PATCH request.
   *
   * @template T - The expected response data type.
   * @param url - The request URL.
   * @param body - Optional request body.
   * @param config{@link TApiConfig}: Optional request configuration.
   * @returns A promise resolving to the API response.
   */
  patch<T, U = unknown>(url: string, body?: U, config?: THttpConfig): Promise<TApiResponse<T>>;

  /**
   * Performs a DELETE request.
   *
   * @template T - The expected response data type.
   * @param url - The request URL.
   * @param body - Optional request body.
   * @param config{@link TApiConfig}: Optional request configuration.
   * @returns A promise resolving to the API response.
   */
  delete<T, U = unknown>(url: string, body?: U, config?: THttpConfig): Promise<TApiResponse<T>>;

  /**
   * Retrieves a cached response by key.
   *
   * @template T - Type of cached data.
   * @param key - Cache key used during the request.
   * @returns Cached data if available, otherwise `undefined`.
   *
   * @example
   * ```ts
   * const cached = api.getCache<User[]>('users:list')
   * ```
   */
  getCache<T>(key: string): T | undefined;

  /**
   * Manually stores data in cache.
   *
   * @template T - Type of data to cache.
   * @param key - Cache key.
   * @param data - Data to store.
   * @param ttl - Optional time-to-live (milliseconds).
   *
   * @example
   * ```ts
   * api.setCache('user:1', { id: 1, name: 'John' }, 5000)
   * ```
   */
  setCache<T>(key: string, data: T, ttl?: number): void;

  /**
   * Removes a specific cache entry by key.
   *
   * @param key - Cache key to remove.
   *
   * @example
   * ```ts
   * api.removeCache('user:1')
   * ```
   */
  removeCache(key: string): void;

  /**
   * Clears all cache entries from the instance.
   *
   * @example
   * ```ts
   * api.clearCache()
   * ```
   */
  clearCache(): void;
}

export const buildURL = (url: string, params?: THttpConfig["params"]) => {
  if (!params) return url;

  const queryString = Object.entries(params)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const joined = value.map((v) => encodeURIComponent(v)).join(",");
        return `${encodeURIComponent(key)}=${joined}`;
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join("&");

  return url.includes("?") ? `${url}&${queryString}` : `${url}?${queryString}`;
};

export class ApiMeta extends Error {
  code: number;
  status: string;

  constructor(code: number, message: string, status: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class ApiInstance implements IApiInstance {
  private baseURL: string;
  private defaultHeaders: globalThis.RequestInit["headers"];
  private interceptors: IApiInterceptor = {};
  private source: string;
  private cache: Map<string, TCacheEntry<unknown>>;
  private maxCacheSize: number;
  private cacheAccessOrder: string[];

  constructor(options: TApiInstanceOptions = {}) {
    this.baseURL = options.baseURL || "";
    this.defaultHeaders = options.headers || {};
    this.source = `komcards-${options.source || "default"}`;
    this.cache = new Map();
    this.maxCacheSize = options.maxCacheSize || 100;
    this.cacheAccessOrder = [];
  }

  setInterceptors(interceptors: IApiInterceptor) {
    this.interceptors = interceptors;
  }

  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private buildcacheKey(config: TApiConfig): string {
    const keyObj = {
      url: config.url,
      params: config.params,
    };

    const keyString = JSON.stringify(keyObj);
    if (keyString.length > 200) {
      return `${this.source}:${this.hash(keyString)}`;
    }

    return `${this.source}:${keyString}`;
  }

  private async fetchWithXHR(
    input: string,
    init: globalThis.RequestInit,
    onUpload?: TProgressCallback,
    onDownload?: TProgressCallback
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const method = (init.method || "GET").toUpperCase();

      xhr.open(method, input);

      if (init.headers) {
        const headers = new Headers(init.headers);
        headers.forEach((value, key) => {
          xhr.setRequestHeader(key, value);
        });
      }

      if (onUpload && xhr.upload) {
        xhr.upload.addEventListener("progress", (e) => {
          const total = e.lengthComputable ? e.total : 0;
          const percentage = e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : 0;
          onUpload({
            loaded: e.loaded,
            total,
            percentage,
          });
        });
      }

      if (onDownload) {
        xhr.responseType = "blob";
        xhr.addEventListener("progress", (e) => {
          const total = e.lengthComputable ? e.total : 0;
          const percentage = e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : 0;
          onDownload({
            loaded: e.loaded,
            total,
            percentage,
          });
        });
      }

      if (init.signal) {
        init.signal.addEventListener("abort", () => {
          xhr.abort();
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      }

      xhr.onload = () => {
        const headers = new Headers();
        xhr
          .getAllResponseHeaders()
          .split("\r\n")
          .forEach((line) => {
            const parts = line.split(": ");
            if (parts.length === 2) {
              headers.append(parts[0], parts[1]);
            }
          });

        const response = new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers,
        });

        resolve(response);
      };

      xhr.onerror = () => reject(new TypeError("Network request failed"));
      xhr.ontimeout = () => reject(new TypeError("Network request timeout"));

      xhr.send(
        init.body as
          | Document
          | Blob
          | ArrayBuffer
          | ArrayBufferView<ArrayBuffer>
          | FormData
          | URLSearchParams
          | string
          | null
      );
    });
  }

  private async fetchWithRetry(
    input: globalThis.RequestInfo,
    init: globalThis.RequestInit,
    retry: number,
    signal?: AbortSignal,
    onUpload?: TProgressCallback,
    onDownload?: TProgressCallback
  ) {
    let attempt = 0;
    let lastErr: unknown;

    while (attempt <= retry) {
      try {
        let res: Response;
        if (onUpload || onDownload) {
          res = await this.fetchWithXHR(input as string, { ...init, signal }, onUpload, onDownload);
        } else {
          res = await fetch(input, { ...init, signal });
        }

        if (!res.ok) {
          const clonedRes = res.clone();
          const error = await clonedRes.json();
          if (error.meta || error.status) {
            const code = error.code || error.meta.code || res.status;
            const message = error.message || error.meta.message || JSON.stringify(error);
            const status = error.status || error.meta.status || res.statusText;
            throw new ApiMeta(code, message, status);
          }
          throw error;
        }
        return res;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          throw err;
        }

        lastErr = err;
        if (attempt === retry) throw lastErr;

        const delay = Math.pow(2, attempt) * 200;
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
      }
    }
    throw lastErr;
  }

  private async handleInterceptors(config: TApiConfig) {
    if (this.interceptors.request) {
      return await this.interceptors.request(config);
    }
    return config;
  }

  private async handleResponse(response: Response) {
    if (this.interceptors.response) {
      return await this.interceptors.response(response);
    }
    return response;
  }

  private async handleError(error: unknown) {
    if (this.interceptors.error) {
      return await this.interceptors.error(error);
    }
    throw error;
  }

  private getCacheEntry<T>(key: string): TCacheEntry<T> | undefined {
    const entry = this.cache.get(key) as TCacheEntry<T> | undefined;
    if (entry) {
      const index = this.cacheAccessOrder.indexOf(key);
      if (index > -1) {
        this.cacheAccessOrder.splice(index, 1);
      }
      this.cacheAccessOrder.push(key);
    }

    return entry;
  }

  private setCacheEntry<T>(key: string, entry: TCacheEntry<T>): void {
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      const oldestKey = this.cacheAccessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, entry);
    const index = this.cacheAccessOrder.indexOf(key);
    if (index > -1) {
      this.cacheAccessOrder.splice(index, 1);
    }
    this.cacheAccessOrder.push(key);
  }

  private removeCacheEntry(key: string): void {
    this.cache.delete(key);
    const index = this.cacheAccessOrder.indexOf(key);
    if (index > -1) {
      this.cacheAccessOrder.splice(index, 1);
    }
  }

  async request<T>(config: TApiConfig): Promise<TApiResponse<T>> {
    try {
      const finalConfig = await this.handleInterceptors(config);
      const cacheKey = this.buildcacheKey(finalConfig);

      if (finalConfig.cache && finalConfig.cache.enabled && finalConfig.method === "GET") {
        const cached = this.getCacheEntry<T>(cacheKey);
        if (cached) {
          const expired = cached.ttl && Date.now() - cached.timestamp > cached.ttl;
          if (!expired) {
            return { data: cached.data as T, cacheKey, fromCache: true };
          }
          this.removeCacheEntry(cacheKey);
        }
      }

      const url = this.baseURL ? `${this.baseURL}${finalConfig.url}` : finalConfig.url;
      const finalURL = buildURL(url, finalConfig.params);
      const isFormData = finalConfig.body instanceof FormData;

      const response = await this.fetchWithRetry(
        finalURL,
        {
          method: finalConfig.method || "GET",
          headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...this.defaultHeaders,
            ...finalConfig.headers,
          },
          body: isFormData
            ? finalConfig.body
            : finalConfig.body
            ? JSON.stringify(finalConfig.body)
            : undefined,
        },
        finalConfig.retry ?? 0,
        finalConfig.signal,
        finalConfig.onUpload,
        finalConfig.onDownload
      );

      const finalResponse = await this.handleResponse(response);
      if (!finalResponse.ok) {
        try {
          const error = await finalResponse.clone().json();
          if (error.meta || error.status) {
            const code = error.code || error.meta.code || finalResponse.status;
            const message = error.message || error.meta.message || JSON.stringify(error);
            const status = error.status || error.meta.status || finalResponse.statusText;
            throw new ApiMeta(code, message, status);
          }
          throw error;
        } catch {
          const errorText = await finalResponse.text();
          throw new Error(errorText || finalResponse.statusText);
        }
      }

      const contentType = finalResponse.headers.get("content-type") || "";
      let data: T;
      if (contentType.includes("application/json")) {
        data = (await finalResponse.json()) as T;
      } else if (contentType.includes("text/")) {
        data = (await finalResponse.text()) as T;
      } else {
        data = (await finalResponse.blob()) as T;
      }

      if (finalConfig.cache && finalConfig.cache.enabled && finalConfig.method === "GET") {
        this.setCacheEntry(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: finalConfig.cache?.revalidate,
        });
      }

      return { data, cacheKey, fromCache: false };
    } catch (error) {
      return this.handleError(error) as Promise<TApiResponse<T>>;
    }
  }

  get<T>(url: string, config: THttpConfig = {}) {
    return this.request<T>({ ...config, url, method: "GET" });
  }

  post<T, U = unknown>(url: string, body?: U, config: THttpConfig = {}) {
    return this.request<T>({ ...config, url, method: "POST", body: body as globalThis.BodyInit });
  }

  put<T, U = unknown>(url: string, body?: U, config: THttpConfig = {}) {
    return this.request<T>({ ...config, url, method: "PUT", body: body as globalThis.BodyInit });
  }

  patch<T, U = unknown>(url: string, body?: U, config: THttpConfig = {}) {
    return this.request<T>({ ...config, url, method: "PATCH", body: body as globalThis.BodyInit });
  }

  delete<T, U = unknown>(url: string, body?: U, config: THttpConfig = {}) {
    return this.request<T>({ ...config, url, method: "DELETE", body: body as globalThis.BodyInit });
  }

  getCache<T>(key: string): T | undefined {
    const entry = this.getCacheEntry<T>(key);
    return entry?.data as T | undefined;
  }

  setCache<T>(key: string, data: T, ttl?: number): void {
    this.setCacheEntry(key, { data, timestamp: Date.now(), ttl });
  }

  removeCache(key: string): void {
    this.removeCacheEntry(key);
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheAccessOrder = [];
  }
}

const instance = new ApiInstance();

const http = {
  get: <T>(url: string, config?: THttpConfig) => instance.get<T>(url, config),
  post: <T, U = unknown>(url: string, body?: U, config?: THttpConfig) =>
    instance.post<T, U>(url, body, config),
  put: <T, U = unknown>(url: string, body?: U, config?: THttpConfig) =>
    instance.put<T, U>(url, body, config),
  patch: <T, U = unknown>(url: string, body?: U, config?: THttpConfig) =>
    instance.patch<T, U>(url, body, config),
  delete: <T, U = unknown>(url: string, body?: U, config?: THttpConfig) =>
    instance.delete<T, U>(url, body, config),
  getCache: <T>(key: string) => instance.getCache<T>(key),
  setCache: <T>(key: string, data: T, ttl?: number) => instance.setCache<T>(key, data, ttl),
  removeCache: (key: string) => instance.removeCache(key),
  clearCache: () => instance.clearCache(),
  request: (config: TApiConfig) => instance.request(config),
  create: (options: TApiInstanceOptions = {}): IApiInstance => new ApiInstance(options),
};

export default http;

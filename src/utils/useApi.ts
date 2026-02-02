import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  ApiInstance,
  buildURL,
  type IApiInterceptor,
  type TApiConfig,
  type TApiInstanceOptions,
  type TApiResponse,
  type THttpConfig,
  type TProgress,
} from './api'

type TFetchState<T> = {
  data: T | null
  error: unknown
  isLoading: boolean
  cacheKey: string | null
}

type TFetchResult<T> = TFetchState<T> & {
  refetch: () => Promise<TFetchState<T>>
}

type TMutationOptions = Pick<TApiConfig, 'cache' | 'headers' | 'method' | 'signal'> & {
  progress?: 'upload' | 'download'
  queryMutation?: boolean
}

type TMutationResult<TData, TRequest> = {
  mutate: (request?: TRequest) => Promise<TApiResponse<TData>>
  isLoading: boolean
  cacheKey: string | null
  progress: TProgress | null
}

type TInfiniteFetchOptions<T> = {
  initialOffset: number
  offsetKey?: string
  setOffset: (lastItems: T, allItems: T[], lastOffset: number) => number | null
}

type TInfiniteFetchResult<T> = {
  data: T[]
  error: unknown
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<void>
  refetch: () => Promise<void>
}

export type TApiHooks = {
  /**
   * React hook for data fetching with built-in loading, error, and refetch states.
   *
   * @typeParam T - Expected data type from the API response.
   * @param url - The endpoint URL (relative to instance baseURL).
   * @param config - Optional HTTP configuration (headers, params, cache, etc.).
   * @param enabled - Whether the fetch should run automatically on mount.
   *
   * @returns An object with:
   * - `data`: fetched data or `null`
   * - `error`: any error encountered
   * - `isLoading`: request state
   * - `cacheKey`: identifier for caching this request
   * - `refetch()`: manually trigger a new fetch
   *
   * @example
   * ```tsx
   * const { data, isLoading, refetch } = api.fetch<User[]>('/users')
   * ```
   */
  fetch: <T>(url: string, config?: Omit<THttpConfig, 'onUpload' | 'onDownload'>, enabled?: boolean) => TFetchResult<T>

  /**
   * React hook for making data mutations (e.g. POST, PUT, DELETE) with built-in
   * loading state, upload/download progress tracking, and request deduplication.
   *
   * @typeParam TData - Expected data type of the response.
   * @typeParam TRequest - Payload type for the mutation body or query param.
   *
   * @param url - Endpoint URL for the mutation.
   * @param config - Optional mutation config (method, headers, cache, progress, etc.) with queryMutation for bad practice mutate fetching using query while true.
   *
   * @returns An object with:
   * - `mutate(request)`: Function to trigger the mutation.
   * - `isLoading`: Whether the request is currently in progress.
   * - `cacheKey`: Identifier for caching this request.
   * - `progress`: Download or Upload progress info (loaded, total, percentage) - only available when progress is enabled
   *
   * @example
   * ```tsx
   *
   * // With upload progress
   * const { mutate, isLoading, progress } = api.mutation<User, FormData>('/upload', {
   *   method: 'POST',
   *   progress: 'upload'
   * })
   *
   * const handleSubmit = async (form: FormData) => {
   *   const { data } = await mutate(form)
   *   console.log(data)
   * }
   *
   * // Show progress
   * {progress && <div>Uploaded: {progress.percentage}%</div>}
   * ```
   */
  mutation: <TData, TRequest = void>(url: string, config?: TMutationOptions) => TMutationResult<TData, TRequest>

  /**
   * React hook for infinite pagination fetching with custom offset logic.
   *
   * @typeParam T - Expected data type from the API response.
   * @param url - Endpoint URL (relative to instance baseURL).
   * @param options - Infinite pagination options.
   * @param config - Optional HTTP configuration (headers, params, etc.).
   * @returns Object containing paginated data, loading states, and pagination controls.
   *
   * @example
   * ```tsx
   * const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = api.infinite<User[]>('/users', {
   *   initialOffset: 0,
   *   setOffset: (lastItems, allItems, lastOffset) => {
   *     return lastItems.length ? lastOffset + 10 : null
   *   },
   * })
   * ```
   */
  infinite: <T>(url: string, options: TInfiniteFetchOptions<T>, config?: THttpConfig) => TInfiniteFetchResult<T>

  // ----------- cache ops -----------
  /**
   * Retrieves a cached response by its key.
   * @param key - Unique cache key.
   * @returns Cached data or `undefined` if not found.
   */
  getCache: <T>(key: string) => T | undefined

  /**
   * Stores data in cache.
   * @param key - Cache key.
   * @param data - Data to store.
   * @param ttl - Optional time-to-live in milliseconds.
   */
  setCache: <T>(key: string, data: T, ttl?: number) => void

  /**
   * Removes a single cached entry.
   * @param key - Cache key to remove.
   */
  removeCache: (key: string) => void

  /**
   * Clears all cache entries.
   */
  clearCache: () => void

  // ----------- interceptors -----------

  /**
   * Registers custom request/response interceptors.
   *
   * @param interceptors - Object containing optional `request`, `response`, and `error` interceptors.
   *
   * @example
   * ```ts
   * api.setInterceptors({
   *   request: config => config,
   *   response: res => res,
   *   error: err => Promise.reject(err),
   * })
   * ```
   */
  setInterceptors: (interceptors: IApiInterceptor) => void
}

const pendingRequests: Map<string, Promise<TApiResponse<unknown>>> = new Map()

/**
 * Creates a new API instance with built-in React hooks (`fetch`, `mutation`, `infinite`)
 * for performing typed data fetching and mutations with progress tracking.
 *
 * @param options - Optional configuration for the API instance (e.g. baseURL, default headers).
 * @returns An object containing data hooks (`fetch`, `mutation`, `infinite`), cache manipulation methods, and interceptor registration.
 *
 * @example
 * ```tsx
 * const api = createApi({ baseURL: '/api' })
 *
 * const { data, isLoading, refetch } = api.fetch<User[]>('/users')
 *
 * const { mutate, isLoading, progress } = api.mutation<User, FormData>('/users', { method: 'POST' })
 *
 * const { data, isLoading, refetch } = api.infinite<User[]>('/users', { initialOffset: 0 })
 * ```
 */
export default function createApi(options: TApiInstanceOptions = {}): TApiHooks {
  const instance = new ApiInstance(options)

  function useFetch<T>(
    url: string,
    config?: Omit<THttpConfig, 'onUpload' | 'onDownload'>,
    enabled: boolean = true,
  ): TFetchResult<T> {
    const abortControllerRef = useRef<AbortController | null>(null)

    const [state, setState] = useState<TFetchState<T>>({
      data: null,
      error: null,
      isLoading: enabled,
      cacheKey: null,
    })

    const stableConfig = useMemo(
      () => config,
      [
        config?.cache?.enabled,
        config?.cache?.revalidate,
        JSON.stringify(config?.headers),
        JSON.stringify(config?.params),
      ],
    )

    const fetchData = useCallback(
      async (refetch: boolean = false): Promise<TFetchState<T>> => {
        if (!enabled && !refetch) {
          return { data: null, error: null, isLoading: false, cacheKey: null }
        }

        if (abortControllerRef.current) abortControllerRef.current.abort()
        abortControllerRef.current = new AbortController()

        setState(s => {
          if (s.isLoading) return s
          return { ...s, isLoading: true }
        })

        try {
          const response = await instance.get<T>(url, {
            ...stableConfig,
            signal: abortControllerRef.current.signal,
          })

          const newState: TFetchState<T> = {
            data: response.data,
            error: null,
            isLoading: false,
            cacheKey: response.cacheKey ?? null,
          }
          setState(newState)
          return newState
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            return state
          }
          const newState: TFetchState<T> = {
            data: null,
            error: err,
            isLoading: false,
            cacheKey: null,
          }
          setState(newState)
          return newState
        }
      },
      [enabled, url, stableConfig],
    )

    useEffect(() => {
      fetchData()
      return () => {
        if (abortControllerRef.current) abortControllerRef.current.abort()
      }
    }, [fetchData])

    return { ...state, refetch: () => fetchData(true) }
  }

  function useMutation<TData, TRequest = void>(
    url: string,
    config?: TMutationOptions,
  ): TMutationResult<TData, TRequest> {
    const abortControllerRef = useRef<AbortController | null>(null)

    const [state, setState] = useState<Omit<TMutationResult<TData, TRequest>, 'mutate'>>({
      isLoading: false,
      cacheKey: null,
      progress: null,
    })

    const stableConfig = useMemo(
      () => config,
      [
        config?.method,
        config?.cache?.enabled,
        config?.cache?.revalidate,
        config?.queryMutation,
        config?.progress,
        JSON.stringify(config?.headers ?? {}),
      ],
    )

    const mutate = useCallback(
      async (request?: TRequest): Promise<TApiResponse<TData>> => {
        if (abortControllerRef.current) abortControllerRef.current.abort()
        abortControllerRef.current = new AbortController()
        setState(s => ({ ...s, isLoading: true, progress: null }))

        let requestKey: string = ''
        try {
          const method = stableConfig?.method || 'GET'
          requestKey = JSON.stringify({ url, method, request })

          if (pendingRequests.has(requestKey)) {
            return pendingRequests.get(requestKey)! as Promise<TApiResponse<TData>>
          }

          const shouldTrackUpload = stableConfig?.progress === 'upload'
          const shouldTrackDownload = stableConfig?.progress === 'download'

          let requestPromise: Promise<TApiResponse<TData>>
          if (method === 'GET') {
            requestPromise = instance.get<TData>(url, {
              ...stableConfig,
              params: request as THttpConfig['params'],
              signal: abortControllerRef.current.signal,
              onDownload: shouldTrackDownload
                ? progress => {
                    setState(s => ({ ...s, progress: progress }))
                  }
                : undefined,
            })
          } else {
            requestPromise = instance.request<TData>({
              ...stableConfig,
              url: config?.queryMutation ? buildURL(url, request as THttpConfig['params']) : url,
              method,
              body: request ? (request as globalThis.BodyInit) : undefined,
              signal: abortControllerRef.current.signal,
              onUpload: shouldTrackUpload
                ? progress => {
                    setState(s => ({ ...s, progress }))
                  }
                : undefined,
            })
          }

          pendingRequests.set(requestKey, requestPromise)
          const response = await requestPromise
          setState({
            isLoading: false,
            cacheKey: response.cacheKey ?? null,
            progress: null,
          })

          return response
        } catch (err) {
          setState({ isLoading: false, cacheKey: null, progress: null })
          throw err
        } finally {
          if (pendingRequests.has(requestKey)) pendingRequests.delete(requestKey)
        }
      },
      [url, stableConfig],
    )

    useEffect(() => {
      return () => {
        if (abortControllerRef.current) abortControllerRef.current.abort()
      }
    }, [])

    return { mutate, ...state }
  }

  function useInfiniteFetch<T>(
    url: string,
    options: TInfiniteFetchOptions<T>,
    config?: THttpConfig,
  ): TInfiniteFetchResult<T> {
    const { initialOffset, offsetKey, setOffset } = options
    const abortControllerRef = useRef<AbortController | null>(null)

    const [items, setItems] = useState<T[]>([])
    const [offset, setOffsetState] = useState(initialOffset)
    const [isLoading, setIsLoading] = useState(false)
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
    const [hasNextPage, setHasNextPage] = useState(true)
    const [error, setError] = useState<unknown>(null)

    const stableConfig = useMemo(
      () => config,
      [
        config?.cache?.enabled,
        config?.cache?.revalidate,
        JSON.stringify(config?.headers),
        JSON.stringify(config?.params),
      ],
    )

    const fetchPage = useCallback(
      async (offsetValue: number, append = false) => {
        if (abortControllerRef.current) abortControllerRef.current.abort()
        abortControllerRef.current = new AbortController()

        if (!append) setIsLoading(true)
        else setIsFetchingNextPage(true)

        try {
          const response = await instance.get<T>(url, {
            ...config,
            params: { ...(config?.params ?? {}), [offsetKey ?? 'offset']: offsetValue },
            signal: abortControllerRef.current.signal,
          })

          const { data } = response
          setItems(prev => (append ? [...prev, data] : [data]))

          const nextOffset = setOffset(data, append ? [...items, data] : [data], offsetValue)
          if (nextOffset === null || nextOffset === undefined) {
            setHasNextPage(false)
          } else {
            setHasNextPage(true)
            setOffsetState(nextOffset)
          }

          setError(null)
        } catch (err) {
          if (!(err instanceof Error && err.name === 'AbortError')) {
            setError(err)
          }
        } finally {
          setIsLoading(false)
          setIsFetchingNextPage(false)
        }
      },
      [url, stableConfig, offsetKey],
    )

    const fetchNextPage = useCallback(async () => {
      if (!hasNextPage || isFetchingNextPage) return
      await fetchPage(offset, true)
    }, [offset, hasNextPage, isFetchingNextPage, fetchPage])

    const refetch = useCallback(async () => {
      setItems([])
      setOffsetState(initialOffset)
      setHasNextPage(true)
      await fetchPage(initialOffset, false)
    }, [initialOffset, fetchPage])

    useEffect(() => {
      fetchPage(initialOffset)
      return () => {
        if (abortControllerRef.current) abortControllerRef.current.abort()
      }
    }, [fetchPage, initialOffset])

    return {
      data: items,
      error,
      isLoading,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
      refetch,
    }
  }

  return {
    // ----------- React hooks API -----------
    fetch: useFetch,
    mutation: useMutation,
    infinite: useInfiniteFetch,

    // ----------- cache ops -----------
    getCache: <T>(key: string) => instance.getCache<T>(key),
    setCache: <T>(key: string, data: T, ttl?: number) => instance.setCache<T>(key, data, ttl),
    removeCache: (key: string) => instance.removeCache(key),
    clearCache: () => instance.clearCache(),

    // ----------- interceptors -----------
    setInterceptors: (interceptors: IApiInterceptor) => instance.setInterceptors(interceptors),
  }
}

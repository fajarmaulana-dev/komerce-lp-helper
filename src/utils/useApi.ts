import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { TPrimitive } from '@/types'

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

type TInfiniteFetchOptions<T, TOffset extends TPrimitive = TPrimitive> = {
  initialOffset: TOffset
  offsetKey?: string
  setOffset: (lastItems: T, allItems: T, lastOffset: TOffset) => TOffset | null
}

type TInfiniteFetchResult<T> = {
  data: T | null
  error: unknown
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<void>
  refetch: () => Promise<void>
}

type TBatchResponse<T extends unknown[]> = {
  [K in keyof T]: TApiResponse<T[K]>
}

type TBatchResult<T extends unknown[]> = {
  mutate: (overrideRequests?: { [K in keyof T]: string | TApiConfig }) => Promise<TBatchResponse<T>>
  isLoading: boolean
  error: unknown
  cacheKeys: (string | null)[]
}

export interface IApiHooks {
  /**
   * React hook for data fetching with built-in loading, error, and refetch states.
   *
   * @typeParam T - Expected data type from the API response.
   * @param url - The endpoint URL (relative to instance baseURL). Changing this value automatically triggers a new request.
   * @param config - Optional HTTP configuration (headers, params, cache, etc.). This acts as hook dependency.
   * @param enabled - Whether the fetch should run automatically on mount or when URL changes.
   *
   * @returns An object with:
   * - `data`: fetched data or `null`
   * - `error`: any error encountered
   * - `isLoading`: request state
   * - `cacheKey`: identifier for caching this request
   * - `refetch()`: manually trigger a fresh fetch without changing dependencies
   *
   * @example
   * ```tsx
   * // 1. Basic static mapping
   * const { data, isLoading, refetch } = api.fetch<User[]>('/users')
   *
   * // 2. Dynamic URL with automatic refetch when ID changes
   * // Provide a dynamic template string. Adding `!!userId` to `enabled` mapping prevents fetching if ID is empty.
   * const { data: userProfile } = api.fetch<User>(
   *   userId ? `/users/${userId}` : '',
   *   undefined,
   *   !!userId
   * )
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
   * @param url - Endpoint URL for the mutation. Can be dynamic if re-initialized.
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
   * // 1. Basic POST request
   * const { mutate: createUser } = api.mutation<User, Partial<User>>('/users', { method: 'POST' })
   *
   * // 2. Dynamic URL based on ID
   * const { mutate: updateProfile } = api.mutation<User, Partial<User>>(`/users/${userId}`, { method: 'PUT' })
   *
   * // 3. With upload progress
   * const { mutate: uploadFile, isLoading, progress } = api.mutation<any, FormData>('/upload', {
   *   method: 'POST',
   *   progress: 'upload'
   * })
   *
   * const handleSubmit = async (form: FormData) => {
   *   const { data } = await uploadFile(form)
   *   console.log(data)
   * }
   *
   * // Show progress in JSX
   * {progress && <div>Uploaded: {progress.percentage}%</div>}
   * ```
   */
  mutation: <TData, TRequest = void>(url: string, config?: TMutationOptions) => TMutationResult<TData, TRequest>

  /**
   * React hook for executing multiple API requests in parallel.
   *
   * @typeParam T - A tuple of expected data types for each request.
   * @param initialRequests - Optional array of URLs or full request configurations.
   *
   * @returns An object with:
   * - `mutate(overrideRequests)`: Function to trigger the batch execution.
   * - `isLoading`: Whether any request in the batch is in progress.
   * - `error`: The first error encountered during execution.
   * - `cacheKeys`: Array of cache keys for each request in the batch.
   *
   * @example
   * ```tsx
   * const { mutate, isLoading } = api.batch<[User[], Post[]]>([
   *   '/users',
   *   { url: '/posts', method: 'GET' }
   * ])
   *
   * const handleLoad = async () => {
   *   const results = await mutate()
   *   const users = results[0].data
   *   const posts = results[1].data
   * }
   * ```
   */
  batch: <T extends unknown[]>(initialRequests?: { [K in keyof T]: string | TApiConfig }) => TBatchResult<T>

  /**
   * React hook for infinite pagination fetching with custom offset logic.
   *
   * @typeParam T - Expected data type from the API response.
   * @param url - Endpoint URL (relative to instance baseURL). Changing this value automatically resets the items and fetches from the beginning on the new URL.
   * @param options - Infinite pagination options.
   * @param config - Optional HTTP configuration (headers, params, etc.). This acts as hook dependency.
   * @param enabled - Whether the fetch should run automatically on mount or when URL changes.
   * @returns Object containing paginated data, loading states, and pagination controls.
   *
   * @example
   * ```tsx
   * // 1. Basic usage
   * const { data, isLoading, hasNextPage, fetchNextPage } = api.infinite<User[]>('/users', {
   *   initialOffset: 0,
   *   setOffset: (lastItems, allItems, lastOffset) => {
   *     return lastItems.length ? lastOffset + 10 : null
   *   },
   * })
   *
   * // 2. Dynamic URL with automatic refetch when category ID changes
   * // When `categoryId` changes, the hook will reset pagination states and re-fetch for the new category path.
   * const { data: categoryItems } = api.infinite<Item[]>(
   *   categoryId ? `/categories/${categoryId}/items` : '',
   *   { initialOffset: 1, setOffset: (last, all, current) => current + 1 },
   *   undefined,
   *   !!categoryId
   * )
   * ```
   */
  infinite: <T, TOffset extends TPrimitive = TPrimitive>(
    url: string,
    options: TInfiniteFetchOptions<T, TOffset>,
    config?: THttpConfig,
    enabled?: boolean,
  ) => TInfiniteFetchResult<T>

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
export default function createApi(options: TApiInstanceOptions = {}): IApiHooks {
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

    const stateRef = useRef(state)
    useEffect(() => {
      stateRef.current = state
    }, [state])

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
        const controller = new AbortController()
        abortControllerRef.current = controller

        setState(s => {
          if (s.isLoading) return s
          return { ...s, isLoading: true }
        })

        try {
          const response = await instance.get<T>(url, {
            ...stableConfig,
            signal: controller.signal,
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
            return stateRef.current
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

  function useBatch<T extends unknown[]>(initialRequests?: { [K in keyof T]: string | TApiConfig }): TBatchResult<T> {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<unknown>(null)
    const [cacheKeys, setCacheKeys] = useState<(string | null)[]>([])
    const isMountedRef = useRef(true)
    const baseRequests = useRef(initialRequests)

    useEffect(() => {
      baseRequests.current = initialRequests
    }, [initialRequests])

    useEffect(() => {
      isMountedRef.current = true
      return () => {
        isMountedRef.current = false
      }
    }, [])

    const mutate = useCallback(
      async (overrideRequests?: { [K in keyof T]: string | TApiConfig }): Promise<TBatchResponse<T>> => {
        const targetRequests = overrideRequests || baseRequests.current
        if (!targetRequests) throw new Error('No requests defined for batch execution.')

        if (isMountedRef.current) {
          setIsLoading(true)
          setError(null)
        }

        try {
          const promises = (targetRequests as (string | TApiConfig)[]).map(req => {
            const config: TApiConfig = typeof req === 'string' ? { url: req, method: 'GET' } : req
            return instance.request(config)
          })

          const results = await Promise.all(promises)
          if (isMountedRef.current) {
            setCacheKeys(results.map(res => res.cacheKey ?? null))
            setIsLoading(false)
          }
          return results as unknown as TBatchResponse<T>
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            if (isMountedRef.current) setIsLoading(false)
            return new Promise<TBatchResponse<T>>(() => {})
          }
          if (isMountedRef.current) {
            setError(err)
            setIsLoading(false)
          }
          throw err
        }
      },
      [instance],
    )

    return {
      mutate,
      isLoading,
      error,
      cacheKeys,
    }
  }

  function useMutation<TData, TRequest = void>(
    url: string,
    config?: TMutationOptions,
  ): TMutationResult<TData, TRequest> {
    const isMountedRef = useRef(true)

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

    useEffect(() => {
      isMountedRef.current = true
      return () => {
        isMountedRef.current = false
      }
    }, [])

    const mutate = useCallback(
      async (request?: TRequest): Promise<TApiResponse<TData>> => {
        if (isMountedRef.current) {
          setState(s => ({ ...s, isLoading: true, progress: null }))
        }

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
              signal: stableConfig?.signal,
              onDownload: shouldTrackDownload
                ? progress => {
                    if (isMountedRef.current) {
                      setState(s => ({ ...s, progress: progress }))
                    }
                  }
                : undefined,
            })
          } else {
            requestPromise = instance.request<TData>({
              ...stableConfig,
              url: config?.queryMutation ? buildURL(url, request as THttpConfig['params']) : url,
              method,
              body: request ? (request as globalThis.BodyInit) : undefined,
              signal: stableConfig?.signal,
              onUpload: shouldTrackUpload
                ? progress => {
                    if (isMountedRef.current) {
                      setState(s => ({ ...s, progress }))
                    }
                  }
                : undefined,
            })
          }

          pendingRequests.set(requestKey, requestPromise)
          const response = await requestPromise

          if (isMountedRef.current) {
            setState({
              isLoading: false,
              cacheKey: response.cacheKey ?? null,
              progress: null,
            })
          }

          return response
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            if (isMountedRef.current) {
              setState(s => ({ ...s, isLoading: false, progress: null }))
            }
            return new Promise<TApiResponse<TData>>(() => {})
          }
          if (isMountedRef.current) {
            setState({ isLoading: false, cacheKey: null, progress: null })
          }
          throw err
        } finally {
          if (pendingRequests.has(requestKey)) pendingRequests.delete(requestKey)
        }
      },
      [url, stableConfig],
    )

    return { mutate, ...state }
  }

  function useInfiniteFetch<T, TOffset extends TPrimitive = TPrimitive>(
    url: string,
    options: TInfiniteFetchOptions<T, TOffset>,
    config?: Omit<THttpConfig, 'onUpload' | 'onDownload'>,
    enabled: boolean = true,
  ): TInfiniteFetchResult<T> {
    const { initialOffset, offsetKey, setOffset } = options
    const abortControllerRef = useRef<AbortController | null>(null)
    const itemsRef = useRef<T | null>(null)

    const [items, setItems] = useState<T | null>(null)
    const [offset, setOffsetState] = useState(initialOffset)
    const [isLoading, setIsLoading] = useState(enabled)
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

    const setOffsetRef = useRef(setOffset)
    useEffect(() => {
      setOffsetRef.current = setOffset
    }, [setOffset])

    const fetchPage = useCallback(
      async (offsetValue: TOffset, append = false, isRefetch = false) => {
        if (!enabled && !append && !isRefetch) return

        if (abortControllerRef.current) abortControllerRef.current.abort()
        const controller = new AbortController()
        abortControllerRef.current = controller

        if (!append) setIsLoading(true)
        else setIsFetchingNextPage(true)

        try {
          const response = await instance.get<T>(url, {
            ...stableConfig,
            params: {
              ...(stableConfig?.params ?? {}),
              [offsetKey ?? 'offset']: offsetValue as TPrimitive,
            },
            signal: controller.signal,
          })

          const { data } = response
          const currentItems = itemsRef.current
          let nextItems: T

          if (append && currentItems) {
            if (Array.isArray(currentItems) && Array.isArray(data)) {
              nextItems = [...currentItems, ...data] as T
            } else if (
              currentItems &&
              typeof currentItems === 'object' &&
              'data' in currentItems &&
              Array.isArray((currentItems as Record<string, unknown>).data) &&
              data &&
              typeof data === 'object' &&
              'data' in data &&
              Array.isArray((data as Record<string, unknown>).data)
            ) {
              nextItems = {
                ...data,
                data: [
                  ...(currentItems as Record<string, unknown[]>).data,
                  ...(data as Record<string, unknown[]>).data,
                ],
              } as T
            } else {
              nextItems = data
            }
          } else {
            nextItems = data
          }

          itemsRef.current = nextItems
          setItems(nextItems)

          const nextOffset = setOffsetRef.current(data, nextItems, offsetValue)
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
          if (!controller.signal.aborted) {
            setIsLoading(false)
            setIsFetchingNextPage(false)
          }
        }
      },
      [url, stableConfig, offsetKey, enabled],
    )

    const fetchNextPage = useCallback(async () => {
      if (!hasNextPage || isFetchingNextPage) return
      await fetchPage(offset, true)
    }, [offset, hasNextPage, isFetchingNextPage, fetchPage])

    const refetch = useCallback(async () => {
      itemsRef.current = null
      setItems(null)
      setOffsetState(initialOffset)
      setHasNextPage(true)
      await fetchPage(initialOffset, false, true)
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
    batch: useBatch,
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

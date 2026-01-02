import { useCallback, useMemo } from 'react'
import { type NavigateOptions, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

/**
 * Represents the query string parameters of a URL.
 *
 * @example
 * ```ts
 * { page: "1", tags: ["react", "typescript"] }
 * ```
 */
export type TRouterQuery = {
  [key: string]: string | string[]
}

/**
 * Represents the state of the router navigation.
 */
export type TRouterState = {
  /** The target URL for navigation. */
  url?: string
  /** The path shown in the browser as the navigation result. */
  as?: string
  /** Navigation options passed to the router method (`replace`, `state`, etc.) */
  options?: NavigateOptions
  /** Additional metadata that may be attached to the router state. */
  [key: string]: unknown
}

/**
 * Type definition for a navigation function.
 * It can accept either a string path directly, or
 * an object containing `pathname`, `query`, and `hash`.
 */
export interface IRouterPush {
  /**
   * Navigate using a string path.
   *
   * @param url - Destination path, e.g. "/dashboard"
   * @param options - Additional navigation options (`replace`, `state`, etc.)
   */
  (url: string | { pathname: string; query?: TRouterQuery; hash?: string }, options?: NavigateOptions): void

  /**
   * Navigate using an object with query parameters and hash.
   *
   * @param pathObj - Object containing `pathname`, `query`, and `hash`
   * @param options - Additional navigation options
   */
  (pathObj: { pathname: string; query?: TRouterQuery; hash?: string }, options?: NavigateOptions): void
}

/**
 * Custom router API built on top of React Router DOM.
 */
export type TUseRouter = {
  /** Navigate to a new page */
  push: IRouterPush
  /** Navigate to a new page with query parameters */
  route: (pathname: string, query?: TRouterQuery, options?: NavigateOptions) => void
  /** Replace the current history entry with a new one */
  replace: IRouterPush
  /** Go back to the previous page (history -1) */
  back: () => void
  /** Go forward to the next page (history +1) */
  next: () => void
  /** Jump to a specific history index */
  go: (num: number) => void
  /** Reload the current page */
  refresh: () => void
  /** The current pathname without query/hash */
  path: string
  /** The hash portion of the current URL (e.g. "#section1") */
  hash: string
  /** Full path including pathname, query, and hash */
  fullpath: string
  /** The base URL */
  origin: string
  /** Full URL including base URL, pathname, query, and hash */
  href: string
  /** Parsed query parameters as an object */
  query: TRouterQuery
  /** Current route parameters (from `useParams`) */
  params: Record<string, string | undefined>
  /**
   * Registers a callback to be executed before navigating back/forward.
   * The callback can cancel navigation if it returns `false`.
   *
   * @param cb - Function to handle popstate events
   */
  beforePopState: (cb: (state: TRouterState) => boolean) => void
}

/**
 * Custom router API built on top of React Router DOM.
 *
 * @returns An object implementing the {@link TUseRouter} interface
 */
export function useRouter(): TUseRouter {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const query = useMemo(() => {
    const queryObj: TRouterQuery = {}
    searchParams.forEach((value, key) => {
      if (queryObj[key]) {
        queryObj[key] = Array.isArray(queryObj[key])
          ? [...(queryObj[key] as string[]), value]
          : [queryObj[key] as string, value]
      } else {
        queryObj[key] = value
      }
    })
    return queryObj
  }, [searchParams])

  const push = useCallback<IRouterPush>(
    (url, options) => {
      if (typeof url === 'string') {
        navigate(url, options)
      } else {
        const queryString = url.query
          ? '?' +
            new URLSearchParams(
              Object.entries(url.query).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v]),
            ).toString()
          : ''
        const hash = url.hash ? (url.hash.startsWith('#') ? url.hash : `#${url.hash}`) : ''
        navigate(`${url.pathname}${queryString}${hash}`, options)
      }
    },
    [navigate],
  )

  const route = useCallback(
    (pathname: string, query?: TRouterQuery, options?: NavigateOptions) => {
      const searchParams = new URLSearchParams()

      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v))
          } else {
            searchParams.set(key, value)
          }
        })
      }

      const search = searchParams.toString()
      const fullPath = search ? `${pathname}?${search}` : pathname

      navigate(fullPath, options)
    },
    [navigate],
  )

  const replace = useCallback<IRouterPush>(
    (url, options) => {
      const replaceOptions = { ...options, replace: true }
      push(url, replaceOptions)
    },
    [push],
  )

  const back = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const next = useCallback(() => {
    navigate(1)
  }, [navigate])

  const go = useCallback(
    (num: number) => {
      navigate(num)
    },
    [navigate],
  )

  const refresh = useCallback(() => {
    window.location.reload()
  }, [])

  const beforePopState = useCallback(
    (cb: (state: TRouterState) => boolean) => {
      const handlePopState = (event: PopStateEvent) => {
        if (!cb(event.state)) {
          event.preventDefault()
          window.history.pushState(location.state, '', location.pathname + location.search)
        }
      }

      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    },
    [location],
  )

  return {
    push,
    route,
    replace,
    back,
    next,
    go,
    refresh,
    path: location.pathname,
    hash: location.hash,
    fullpath: `${location.pathname}${location.search}${location.hash}`,
    origin: window.location.origin,
    href: window.location.href,
    query,
    params,
    beforePopState,
  }
}

/**
 * A hook for reading and updating query parameters in the URL.
 *
 * @template T - Shape of the query parameters
 * @param defaultValues - Optional default values for query parameters
 *
 * @returns A tuple:
 *  - `queryObj`: The parsed query parameters as an object
 *  - `updateQuery`: A function to update query parameters
 */
export function useQueryParams<T extends Record<string, string | string[]>>(
  defaultValues?: Partial<T>,
): [T, (updates: Partial<T>) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const queryObj = useMemo(() => {
    const result: Partial<Record<string, string | string[]>> = { ...defaultValues }

    searchParams.forEach((value, key) => {
      const allValues = searchParams.getAll(key)
      if (allValues.length > 1) {
        result[key] = allValues
      } else {
        result[key] = value
      }
    })

    return result as T
  }, [searchParams, defaultValues])

  const updateQuery = useCallback(
    (updates: Partial<T>) => {
      const newParams = new URLSearchParams(searchParams)

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          newParams.delete(key)
        } else if (Array.isArray(value)) {
          newParams.delete(key)
          value.forEach(v => newParams.append(key, v))
        } else {
          newParams.set(key, value as string)
        }
      })

      setSearchParams(newParams)
    },
    [searchParams, setSearchParams],
  )

  return [queryObj, updateQuery]
}

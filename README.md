# komerce-lp-helper

A collection of useful React hooks, utilities, and helper functions designed for Komerce Landing Page projects.

## Installation

```bash
npm install @fajarmaulana/komerce-lp-helper
```

## Features

### Components

#### `Form`

A reusable form component that simplifies form submission handling by preventing default browser submit behavior,
collecting form values into a `FormData` object, and passing it to an action callback.

| Prop       | Type                            | Description                                       |
| ---------- | ------------------------------- | ------------------------------------------------- |
| `action`   | `(formData: FormData) => void`  | Function called when the form is submitted.       |
| `ref`      | `Ref<HTMLFormElement>`          | Exposes the underlying `<form>` element.          |
| `children` | `ReactNode`                     | The form’s inner content (inputs, buttons, etc.). |
| `...props` | `ComponentPropsWithRef<'form'>` | All standard HTML form attributes.                |

**Usage:**

```tsx
import { Form } from '@fajarmaulana/komerce-lp-helper'

const handleSubmit = (formData: FormData) => {
  console.log(formData.get('username'))
}

;<Form action={handleSubmit} className="my-form">
  <input name="username" />
  <button type="submit">Submit</button>
</Form>
```

#### `LazyBackground`

A wrapper component that lazily loads a background image when it enters the viewport using the Intersection Observer
API.

| Prop        | Type        | Description                                                 |
| ----------- | ----------- | ----------------------------------------------------------- |
| `url`       | `string`    | The image URL to be lazily loaded as the background.        |
| `children`  | `ReactNode` | Optional elements or content rendered inside the container. |
| `className` | `string`    | Additional CSS class names applied to the outer container.  |

**Usage:**

```tsx
import { LazyBackground } from '@fajarmaulana/komerce-lp-helper'
;<LazyBackground url="https://example.com/bg.jpg" className="h-64 w-full">
  <h1>Content inside lazy background</h1>
</LazyBackground>
```

### Hooks

#### `useDebounce`

Returns a debounced version of a value. It updates the returned value only after a specified delay has passed without
any changes to the input value.

| Parameter | Type     | Default    | Description                         |
| --------- | -------- | ---------- | ----------------------------------- |
| `value`   | `T`      | (Required) | The input value to debounce.        |
| `delay`   | `number` | `500`      | The debounce delay in milliseconds. |

**Returns:** `T` - The debounced value.

**Usage:**

```ts
const debouncedSearchTerm = useDebounce(searchTerm, 500)
```

#### `useDebounceFunc`

Returns a debounced version of a callback function.

| Parameter  | Type           | Default    | Description                                            |
| ---------- | -------------- | ---------- | ------------------------------------------------------ |
| `callback` | `T` (Function) | (Required) | The original function to debounce.                     |
| `delay`    | `number`       | (Required) | Delay in milliseconds before the callback is executed. |

**Returns:** `(...args: Parameters<T>) => void` - A debounced function.

**Usage:**

```ts
const debouncedSearch = useDebounceFunc(q => fetchResults(q), 300)
```

#### `useConditionalDebounce`

Conditionally executes a callback function after a specified debounce delay. Only triggers the callback if a given
condition is `true`.

| Parameter | Type     | Default | Description                         |
| --------- | -------- | ------- | ----------------------------------- |
| `delay`   | `number` | `500`   | The debounce delay in milliseconds. |

**Returns:** `(condition: boolean, callback: () => void) => void` - The function to execute.

**Usage:**

```ts
const run = useConditionalDebounce(300)
run(isValid, () => submitData())
```

#### `useForm`

Manages form fields, retrieval of values, and error handling for both named inputs and standalone fields.

| Parameter              | Type       | Default | Description                                            |
| ---------------------- | ---------- | ------- | ------------------------------------------------------ |
| `fieldsWithoutNameIds` | `string[]` | `[]`    | List of field IDs that exist outside the form element. |

**Returns:**

| Property | Type | Description |
|---|---|---|
| `form` | `RefObject<HTMLFormElement>` | Ref to attach to the target `<form>`. |
| `fields` | `() => TFields<T>` | Function returning the values and elements of named form inputs. |
| `fieldsWithoutName` | `() => TFields<U>` | Function returning the values and elements of external inputs. |

_Note: `TFields` returns an object where keys are the field names and values are of type `TFieldItem<T>` containing
`field_value`, `field_id`, `field_error`, and `field_info`. Create a input component with small element with id
`{fieldName}_error` to show error message, and with id `{fieldName}_info` to show info message._

**Usage:**

```tsx
const { form, fields, fieldsWithoutName } = useForm<{ email: string }>(['custom-input-id'])

const handleSubmit = e => {
  e.preventDefault()
  const data = fields()
  console.log(data.email.field_value)
}

;<form ref={form} onSubmit={handleSubmit}>
  <input name="email" id="email" />
  <span id="email_error"></span>
</form>
```

#### `useRouter`

Custom router API built on top of React Router DOM that provides easier navigation methods and state management.

**Returns:**

| Property | Type | Description |
|---|---|---|
| `push` | `IRouterPush` | Navigate to a new page (string or object with pathname, query, hash). |
| `route` | `(pathname, query?, options?) => void` | Navigate to a new page with query parameters. |
| `replace` | `IRouterPush` | Replace the current history entry. |
| `back` | `() => void` | Go back to previous page. |
| `next` | `() => void` | Go forward to next page. |
| `go` | `(num: number) => void` | Jump to specific history index. |
| `refresh` | `() => void` | Reload the current page. |
| `path` | `string` | The current pathname without query/hash. |
| `hash` | `string` | The hash portion of current URL. |
| `fullpath` | `string` | Full path including query and hash. |
| `origin` | `string` | The base URL. |
| `href` | `string` | Full URL including origin. |
| `query` | `TRouterQuery` | Parsed query parameters as object. |
| `params` | `Record<string, string>` | Current route parameters. |
| `beforePopState` | `(cb) => void` | Hook to cancel navigation if callback returns false. |

#### `useQueryParams`

A hook for reading and updating query parameters in the URL locally.

| Parameter       | Type         | Default     | Description                                   |
| --------------- | ------------ | ----------- | --------------------------------------------- |
| `defaultValues` | `Partial<T>` | `undefined` | Optional default values for query parameters. |

**Returns:** `[T, (updates: Partial<T>) => void]` - Tuple containing query object and updater function.

#### `useSectionObserver`

Uses the Intersection Observer API to detect when a trigger element comes into view and updates the `data-active`
attribute of a target element.

| Parameter    | Type                     | Default    | Description                                         |
| ------------ | ------------------------ | ---------- | --------------------------------------------------- |
| `triggerRef` | `RefObject<HTMLElement>` | (Required) | Ref pointing to the element triggering observation. |
| `targetId`   | `string`                 | (Required) | ID of the target element to toggle `data-active`.   |
| `threshold`  | `number`                 | `0.8`      | Visibility threshold (0 to 1).                      |

#### `useSlider`

Manages logic for custom slider components, including touch/drag support and navigation.

| Parameter       | Type         | Default     | Description                                           |
| --------------- | ------------ | ----------- | ----------------------------------------------------- |
| `data`          | `any[]`      | (Required)  | Array of data to display.                             |
| `mobileOnly`    | `boolean`    | `false`     | If true, slider only works below `mobileBound` width. |
| `infiniteSlide` | `boolean`    | `false`     | Allow infinite sliding.                               |
| `isLoading`     | `boolean`    | `false`     | Is data still loading.                                |
| `mobileBound`   | `number`     | `640`       | Screen width bound for mobile only mode.              |
| `onNext`        | `() => void` | `undefined` | Override the next function.                           |
| `onBack`        | `() => void` | `undefined` | Override the back function.                           |

**Returns:**

| Property | Type | Description |
|---|---|---|
| `currentSlide` | `number` | The current active slide index. |
| `movement` | `number` | Current drag movement value. |
| `grab` | `boolean` | Whether the slider is currently being grabbed/dragged. |
| `disableLeftArrow` | `boolean` | Whether left arrow should be disabled. |
| `disableRightArrow`| `boolean` | Whether right arrow should be disabled. |
| `setCurrentSlide` | `(val) => void` | Manually set the slide. |
| `startSlide` | `(param) => void` | Call on mouse down / touch start. |
| `moveSlide` | `(param) => void` | Call on mouse move / touch move. |
| `endSlide` | `(param) => void` | Call on mouse up / touch end. |
| `next`, `back` | `() => void` | Navigate to next/prev slide. |

### Utilities

#### HTTP Client & API

**`http`** A robust wrapper around `fetch` with caching, retry, and interceptors.

| Method                           | Parameters                                          | Returns                    | Description                   |
| -------------------------------- | --------------------------------------------------- | -------------------------- | ----------------------------- |
| `get`                            | `url: string`, `config?: Omit<THttpConfig, 'body'>` | `Promise<TApiResponse<T>>` | Performs a GET request.       |
| `post`, `put`, `patch`, `delete` | `url: string`, `body?: U`, `config?: THttpConfig`   | `Promise<TApiResponse<T>>` | Performs a mutation request.  |
| `request`                        | `config: TApiConfig`                                | `Promise<TApiResponse<T>>` | Full configuration request.   |
| `getCache`                       | `key: string`                                       | `T \| undefined`           | Retrieves cached data.        |
| `setCache`                       | `key: string, data: T, ttl?: number`                | `void`                     | Manually store data in cache. |
| `removeCache`                    | `key: string`                                       | `void`                     | Remove specific cache entry.  |
| `clearCache`                     |                                                     | `void`                     | Clears all cache.             |
| `create`                         | `options?: TApiInstanceOptions`                     | `IApiInstance`             | Creates a new instance.       |

**`createApi(options)`** Creates a new API instance with built-in React hooks for data fetching, mutation, and infinite
pagination. Returns an object with the following hooks:

**1. `fetch<T>(url, config?, enabled?)`**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | (Required) | The endpoint URL. Changing this automatically triggers a new request. |
| `config` | `Omit<THttpConfig, 'onUpload' \| 'onDownload'>` | `undefined` | Optional HTTP configuration (headers, params, cache, etc.). |
| `enabled` | `boolean` | `true` | Whether the fetch should run automatically on mount or when URL changes. |

**Returns:**
| Property | Type | Description |
|---|---|---|
| `data` | `T \| null` | Fetched data. |
| `error` | `unknown` | Any encountered error. |
| `isLoading`| `boolean` | Request state. |
| `cacheKey` | `string \| null` | Identifier for cache. |
| `refetch` | `() => Promise<TFetchState<T>>` | Manually trigger a fresh fetch. |
| `setData` | `(data) => void` | Manually update state data. |

**Example:**
```tsx
const { data, isLoading, refetch } = api.fetch<User[]>('/users', { params: { status: 'active' } })
```

**2. `mutation<TData, TRequest>(url, config?)`**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | (Required) | Endpoint URL for the mutation. |
| `config` | `TMutationOptions` | `undefined` | Optional mutation config (method, headers, progress, etc.). |

**Returns:**
| Property | Type | Description |
|---|---|---|
| `mutate` | `(request?: TRequest) => Promise<TApiResponse<TData>>` | Trigger the mutation. |
| `isLoading`| `boolean` | In progress state. |
| `progress` | `TProgress \| null` | Upload/Download progress. |

**Example:**
```tsx
const { mutate, isLoading, progress } = api.mutation<User, FormData>('/users/upload', { 
  method: 'POST',
  progress: 'upload'
})

// To trigger:
// await mutate(formData)
```

**3. `infinite<T, TOffset>(url, options, config?, enabled?)`**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | (Required) | Endpoint URL. Changing this resets items and fetches from the beginning. |
| `options` | `TInfiniteFetchOptions` | (Required) | Options containing `initialOffset`, `offsetKey`, and `setOffset` logic. |
| `config` | `Omit<THttpConfig, 'onUpload' \| 'onDownload'>` | `undefined` | Optional HTTP configuration. |
| `enabled` | `boolean` | `true` | Whether the fetch should run automatically. |

**Returns:**
| Property | Type | Description |
|---|---|---|
| `data` | `T \| null` | Aggregated items. |
| `fetchNextPage`| `() => Promise<void>` | Trigger fetch for next offset. |
| `hasNextPage`| `boolean` | More pages available. |
| `isFetchingNextPage`| `boolean` | Fetching next page state. |

**Example:**
```tsx
const { data, fetchNextPage, hasNextPage } = api.infinite<User[], number>(
  '/users',
  {
    initialOffset: 0,
    offsetKey: 'page',
    setOffset: (lastItems, allItems, lastOffset) => {
      return lastItems.length > 0 ? lastOffset + 1 : null
    }
  }
)
```

**4. `batch<T>(initialRequests?)`**
Execute multiple API requests in parallel. 

| Parameter | Type | Default | Description |
|---|---|---|---|
| `initialRequests` | `{ [K in keyof T]: string \| TApiConfig }` | `undefined` | Array of URLs or full request configurations. |

**Returns:**
| Property | Type | Description |
|---|---|---|
| `mutate` | `(overrideRequests?) => Promise<TBatchResponse<T>>` | Trigger the batch execution. |
| `isLoading`| `boolean` | Whether any request in the batch is in progress. |
| `error` | `unknown` | The first error encountered. |
| `cacheKeys`| `(string \| null)[]` | Array of cache keys for each request. |

**Example:**
```tsx
const { mutate, isLoading } = api.batch<[User[], Post[]]>([
  '/users',
  { url: '/posts', method: 'GET' }
])

// To trigger:
// const [usersResponse, postsResponse] = await mutate()
```

#### Interceptor Setup Example

You can set up custom interceptors on an API instance to attach tokens globally, or handle specific error codes:

```typescript
import { ApiMeta, createApi, getCookie, type TApiConfig } from '@fajarmaulana/komerce-lp-helper'

import { INTERNAL_API } from '@/constants/env'

import { COOKIE_KEY_JWT, forceLogout } from './auth'

const PUBLIC_ENDPOINTS: Record<string, string[]> = {
  [INTERNAL_API.baseURL!]: ['/auth/api/v1/live-chat/verify-token'],
}

const isPublicEndpoint = (path: string, baseUrl: string) => {
  const publicPaths = PUBLIC_ENDPOINTS[baseUrl]
  return publicPaths && publicPaths.some(publicPath => path.startsWith(publicPath))
}

const interceptor = {
  request: (config: TApiConfig) => {
    if (!config.baseURL || isPublicEndpoint(config.url, config.baseURL)) return config

    const token = getCookie<string>(COOKIE_KEY_JWT)
    if (!token) {
      forceLogout()
      throw new Error('Token expired or missing')
    }

    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    }
  },
  error: async (error: unknown) => {
    if (error instanceof ApiMeta && [401, 403].includes(error.code)) forceLogout()

    const isNetworkError =
      error instanceof Error &&
      (error.message === 'Network Error' || (error as { code?: string }).code === 'ERR_NETWORK')

    if (isNetworkError && window.location.pathname !== '/error-network') {
      window.location.replace('/error-network')
    }

    return Promise.reject(error)
  },
}

const internalApi = createApi({ ...INTERNAL_API })
internalApi.setInterceptors(interceptor)

export { internalApi }
```

#### Cookie

Managed wrappers for `document.cookie`.

| Function        | Parameters                           | Description                               |
| --------------- | ------------------------------------ | ----------------------------------------- |
| `setCookie`     | `{ key, value, maxAge?: number, sameSite?: Lax/Strict/None }` | Sets a cookie. Value is JSON stringified. |
| `setCookies`    | `items: TCookie[]`                   | Sets multiple cookies.                    |
| `getCookie`     | `key: string`                        | Gets and parses a cookie value.           |
| `getCookies`    | `keys: string[]`                     | Retrieves multiple cookies as an object.  |
| `removeCookie`  | `key: string`                        | Removes a cookie.                         |
| `removeCookies` | `keys: string[]`                     | Removes multiple cookies.                 |
| `clearCookies`  |                                      | Clears all cookies.                       |

#### Local Storage

Type-safe wrappers for `localStorage`.

| Function       | Parameters                | Description                             |
| -------------- | ------------------------- | --------------------------------------- |
| `setLocal`     | `key: string, value: T`   | Stores a value (JSON stringified).      |
| `setLocals`    | `items: { key, value }[]` | Stores multiple values.                 |
| `getLocal`     | `key: string`             | Retrieves and parses a value.           |
| `getLocals`    | `keys: string[]`          | Retrieves multiple values as an object. |
| `removeLocal`  | `key: string`             | Removes an item.                        |
| `removeLocals` | `keys: string[]`          | Removes multiple items.                 |
| `clearLocals`  |                           | Clears local storage.                   |

#### File

Helpers for file and blob manipulation.

| Function                | Parameters                                   | Returns               | Description                                             |
| ----------------------- | -------------------------------------------- | --------------------- | ------------------------------------------------------- |
| `checkImage`            | `url: string`                                | `Promise<string>`     | Checks if an image URL is valid (returns URL or empty). |
| `convertBlob`           | `blob: Blob`                                 | `Promise<string>`     | Converts a Blob to a Base64 string.                     |
| `getExtension`          | `mimeType: string`                           | `string`              | Gets file extension from MIME type.                     |
| `filenameWithExtension` | `blob: Blob, prefix?: string`                | `string`              | Generates a filename.                                   |
| `createDownloadAnchor`  | `blob: Blob, options?: { filename, target }` | `{ anchor, blobUrl }` | Creates an anchor for downloading.                      |
| `downloadBlob`          | `blob: Blob, filename: string`               | `void`                | Triggers a file download.                               |

#### General

Common DOM and string utilities.

| Function         | Parameters                                 | Returns          | Description                                 |
| ---------------- | ------------------------------------------ | ---------------- | ------------------------------------------- |
| `getById`        | `id: string`                               | `HTMLElement`    | Type-safe `document.getElementById`.        |
| `getByAny`       | `selector: string`                         | `HTMLElement`    | Type-safe `document.querySelector`.         |
| `clickById`      | `id: string`                               | `void`           | Triggers a click on an element by ID.       |
| `focusById`      | `id: string`                               | `void`           | Focuses an element by ID.                   |
| `handleHashLink` | `hash: string, currentHash: string, func?` | `void`           | Smooth scrolling for hash links.            |
| `acronym`        | `name: string`                             | `string`         | Generates a 1-2 letter acronym from a name. |
| `isNotPrimitive` | `value: unknown`                           | `boolean`        | Checks if a value is an object/array.       |
| `toWA`           | `message: string, options?: { urlOnly?: boolean; phoneNumber?: string }`                | `string \| void` | Get WhatsApp URL or open in new window.     |

#### Form Validation (Error Provider)

Helpers for validating inputs and displaying error messages dynamically.

**`provideFieldError(params)`** Validates a field against a set of rules, updates the target error element, and modifies
the target `<label>` border color.

- `params`: `{ field_id, field_value, field_error, rules }`
- `rules`: A mapping of error messages to their boolean validation results (`true` = invalid).

**Example Rules:**

```typescript
export const VALID_EMAIL = {
  re: /^(?![.])[A-Za-z0-9._-]+(?<![.])@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,4}$/,
  text: 'masukkan email yang valid',
}

export const ALPHASPACE = {
  re: /^[A-Za-z]+(?: [A-Za-z]+)*$/,
  text: ' hanya boleh berisi huruf dan spasi antar kata',
}

export const REGISTER_RULES = {
  emailRules: (email: string) => ({
    'email harus diisi': !email,
    [VALID_EMAIL.text]: !VALID_EMAIL.re.test(email),
  }),
  fullnameRules: (fullname: string) => ({
    'nama harus diisi': !fullname,
    'panjang nama minimal adalah 3 karakter': fullname.length < 3,
    [`nama ${ALPHASPACE.text}`]: !ALPHASPACE.re.test(fullname),
    'panjang nama maksimal adalah 40 karakter': fullname.length > 40,
  }),
}
```

**`providePasswordFieldError(params)`** Specialized validation for password strength (length, uppercase, lowercase,
numbers, symbols, no spaces).

- `params`: `{ field_id, field_value, field_error }`

## License

MIT

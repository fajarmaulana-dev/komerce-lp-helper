# komerce-lp-helper

A collection of useful React hooks, utilities, and helper functions designed for Komerce Landing Page projects.

## Installation

```bash
npm install @fajarmaulana/komerce-lp-helper
```

## Features

### HTTP Client & API Hooks

#### `http`

A wrapper around `fetch` with support for interceptors, caching, and retries.

```typescript
import { http } from 'komerce-lp-helper'

// GET request
const users = await http.get('/users')

// POST request with body
await http.post('/users', { name: 'John Doe' })

// Using cache
const cachedData = http.getCache('my-key')
```

#### `createApi`

Creates a new API instance with built-in React hooks (`fetch`, `mutation`, `infinite`) for performing typed data
fetching and mutations with progress tracking.

```tsx
import { createApi } from 'komerce-lp-helper'

const api = createApi({ baseURL: '/api' })

// Fetch
const { data, isLoading, refetch } = api.fetch<User[]>('/users')

// Mutation (POST, PUT, DELETE)
const { mutate, isLoading, progress } = api.mutation<User, FormData>('/users', { method: 'POST' })

// Infinite Fetch
const { data, fetchNextPage } = api.infinite<User[]>('/users', {
  initialOffset: 0,
  setOffset: (lastItems, allItems, lastOffset) => (lastItems.length ? lastOffset + 1 : null),
})
```

### Hooks

#### `useDebounce`

Returns a debounced version of a value. Useful for delaying expensive operations.

```typescript
import { useDebounce } from 'komerce-lp-helper'
const debouncedSearchTerm = useDebounce(searchTerm, 500)
```

#### `useDebounceFunc`

Returns a debounced version of a callback function.

```typescript
import { useDebounceFunc } from 'komerce-lp-helper'
const debouncedSearch = useDebounceFunc(q => fetchResults(q), 300)
```

#### `useConditionalDebounce`

Conditionally executes a callback function after a specified debounce delay.

#### `useRouter`

A custom router API built on top of React Router DOM that provides easier navigation methods and state management.

```typescript
import { useRouter } from 'komerce-lp-helper'

const { push, replace, back, query, params } = useRouter()

// Navigate with query params
push({ pathname: '/dashboard', query: { tab: 'settings' } })
```

#### `useQueryParams`

A hook for reading and updating query parameters in the URL locally.

```typescript
import { useQueryParams } from 'komerce-lp-helper'
const [queryObj, updateQuery] = useQueryParams<{ page: string }>()
```

#### `useSlider`

Manages logic for custom slider components, including touch/drag support and navigation.

```typescript
import { useSlider } from 'komerce-lp-helper'
const slider = useSlider({ data: items })
```

#### `useForm`

Manages form fields, retrieval of values, and error handling for both named inputs and standalone fields.

```typescript
import { useForm } from 'komerce-lp-helper'

const { form, fields, fieldsWithoutName } = useForm<{ email: string }>(['custom-input-id'])

const handleSubmit = e => {
  e.preventDefault()
  const data = fields()
  console.log(data.email.field_value)
}
```

#### `useSectionObserver`

Trigger animations or state changes when a section comes into view.

```typescript
import { useSectionObserver } from 'komerce-lp-helper'

const ref = useRef(null)
useSectionObserver({ triggerRef: ref, targetId: 'target-section' })
```

### Utilities

#### Cookie

Managed wrappers for `document.cookie`.

- `setCookie({ key, value, maxAge })`: Sets a cookie.
- `setCookies([ ... ])`: Sets multiple cookies.
- `getCookie(key)`: Gets and parses a cookie value.
- `getCookies([keys])`: Retrieves multiple cookies.
- `removeCookie(key)`: Removes a cookie.
- `removeCookies([keys])`: Removes multiple cookies.
- `clearCookies()`: Clears all cookies.

#### Local Storage

Type-safe wrappers for `localStorage`.

- `setLocal(key, value)`: Stores a value (JSON stringified).
- `setLocals([ ... ])`: Stores multiple values.
- `getLocal(key)`: Retrieves and parses a value.
- `getLocals([keys])`: Retrieves multiple values.
- `removeLocal(key)`: Removes an item.
- `clearLocals()`: Clears local storage.

#### File

Helpers for file and blob manipulation.

- `checkImage(url)`: Checks if an image URL is valid.
- `convertBlob(blob)`: Converts a Blob to a Base64 string.
- `extension(mimeType)`: Gets file extension from MIME type.
- `filenameWithExtension(blob, prefix)`: Generates a filename.
- `createDownloadAnchor(blob, options)`: Creates an anchor for downloading.
- `downloadBlob(blob, filename)`: Triggers a file download.

#### General

Common DOM and string utilities.

- `getById(id)`: Type-safe `document.getElementById`.
- `getByAny(selector)`: Type-safe `document.querySelector`.
- `clickById(id)`: Triggers a click on an element by ID.
- `focusById(id)`: Focuses an element by ID.
- `handleHashLink(hash, currentHash)`: Smooth scrolling for hash links.
- `acronym(name)`: Generates a 2-letter acronym from a name.
- `isNotPrimitive(value)`: Checks if a value is an object/array.

#### Form Validation

Helpers for validating inputs and displaying error messages.

- `provideFieldError(params)`: Validates a field against a set of rules and updates the error element.
- `providePasswordFieldError(params)`: Specialized validation for password strength (length, uppercase, lowercase,
  numbers, symbols).

### Components

- `Form`: A wrapper component for HTML forms.
- `LazyBackground`: Component for lazy loading background images.

## License

MIT

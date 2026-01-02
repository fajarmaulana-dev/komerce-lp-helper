interface ICheckImage {
  (url: string): Promise<string>
}

interface IConvertBlob {
  (blob: Blob): Promise<string>
}

interface ICreateDownloadAnchor {
  (
    blob: Blob,
    options?: { filename?: string; target?: string },
  ): {
    anchor: HTMLAnchorElement
    blobUrl: string
  }
}

interface IDownloadBlob {
  (blob: Blob, filename: string): void
}

/**
 * Check if an image URL is valid by attempting to load it.
 *
 * @param url - The image URL to check.
 */
export const checkImage: ICheckImage = url =>
  new Promise(resolve => {
    const img = new Image()
    img.src = url
    img.onload = () => resolve(url)
    img.onerror = () => resolve('')
  })

/**
 * Converts a Blob object into a Base64-encoded data URL string.
 *
 * @param blob - The Blob object to be converted.
 * @returns - A Promise that resolves to a Base64-encoded data URL string.
 */
export const convertBlob: IConvertBlob = blob => {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

/**
 * Gets the file extension suggestion based on MIME type
 *
 * @param mimeType - The MIME type string
 * @returns Suggested file extension (without dot)
 *
 * @example
 * ```ts
 * const ext = getExtension('application/pdf')
 * console.log(ext) // 'pdf'
 * ```
 */
export function getExtension(mimeType: string): string {
  const cleanMimeType = mimeType.split(';')[0].trim().toLowerCase()
  const mimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.oasis.opendocument.text': 'odt',
    'application/vnd.oasis.opendocument.spreadsheet': 'ods',
    'application/vnd.oasis.opendocument.presentation': 'odp',
    'application/rtf': 'rtf',
    'application/json': 'json',
    'application/xml': 'xml',
    'application/yaml': 'yaml',
    'text/xml': 'xml',
    'text/csv': 'csv',
    'text/plain': 'txt',
    'text/markdown': 'md',
    'text/html': 'html',
    'text/css': 'css',
    'text/javascript': 'js',
    'application/javascript': 'js',
    'application/typescript': 'ts',
    'application/xhtml+xml': 'xhtml',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-7z-compressed': '7z',
    'application/gzip': 'gz',
    'application/x-tar': 'tar',
    'application/x-bzip2': 'bz2',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/avif': 'avif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/x-msvideo': 'avi',
    'video/quicktime': 'mov',
    'video/x-matroska': 'mkv',
    'video/mpeg': 'mpeg',
    'video/x-flv': 'flv',
    'video/3gpp': '3gp',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'weba',
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    'audio/x-m4a': 'm4a',
    'audio/midi': 'midi',
    'font/woff': 'woff',
    'font/woff2': 'woff2',
    'font/ttf': 'ttf',
    'font/otf': 'otf',
    'application/font-woff': 'woff',
    'application/font-woff2': 'woff2',
    'application/x-font-ttf': 'ttf',
    'application/x-font-otf': 'otf',
    'application/octet-stream': 'bin',
    'application/x-shockwave-flash': 'swf',
    'application/vnd.apple.installer+xml': 'mpkg',
    'application/x-apple-diskimage': 'dmg',
  }

  if (mimeMap[cleanMimeType]) {
    return mimeMap[cleanMimeType]
  }

  const parts = cleanMimeType.split('/')
  if (parts.length === 2) {
    let subtype = parts[1]
    subtype = subtype.replace(/^(x-|vnd\.)/, '')
    subtype = subtype.split('+')[0]
    const dashParts = subtype.split('-')
    subtype = dashParts[dashParts.length - 1]
    if (subtype && /^[a-z0-9]{2,4}$/.test(subtype)) {
      return subtype
    }
  }
  return 'bin'
}

/**
 * Generates a suggested filename from a Blob based on its MIME type
 *
 * @param blob - The Blob to generate filename for
 * @param prefix - Optional prefix for the filename (default: 'download')
 * @returns Suggested filename with extension
 *
 * @example
 * ```ts
 * const blob = new Blob(['data'], { type: 'application/pdf' })
 * const filename = filenameWithExtension(blob)
 * console.log(filename) // 'download.pdf'
 * ```
 */
export function filenameWithExtension(blob: Blob, prefix: string = 'download') {
  const ext = getExtension(blob.type)
  return `${prefix}.${ext}`
}

/**
 * Creates an HTMLAnchorElement configured for downloading a Blob.
 * The anchor has href set to a blob URL and target="_blank".
 *
 * @param blob - The Blob to download
 * @param options - Optional configuration
 * @param options.filename - Default filename for download (can be overridden later with anchor.download)
 * @param options.target - Target attribute for anchor (default: '_blank')
 * @returns Object containing the anchor element and blob URL (for cleanup)
 *
 * @example
 * ```ts
 * const blob = new Blob(['Hello'], { type: 'text/plain' })
 * const { anchor, blobUrl } = createDownloadAnchor(blob, { filename: 'hello.txt' })
 *
 * // Dont forget to cleanup while done
 * URL.revokeObjectURL(blobUrl)
 * ```
 */
export const createDownloadAnchor: ICreateDownloadAnchor = (blob: Blob, options) => {
  const blobUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.target = options?.target ?? '_blank'

  if (options?.filename) {
    anchor.download = options.filename
  }

  return { anchor, blobUrl }
}

/**
 * Triggers a download of a Blob by creating a temporary anchor, clicking it, and cleaning up.
 * This is a one-shot download function that handles all cleanup automatically.
 *
 * @param blob - The Blob to download
 * @param filename - The filename for the download
 *
 * @example
 * ```ts
 * const blob = new Blob(['Hello World'], { type: 'text/plain' })
 * downloadBlob(blob, 'hello.txt')
 * // Download starts immediately, cleanup is automatic
 * ```
 */
export const downloadBlob: IDownloadBlob = (blob: Blob, filename: string) => {
  const { anchor, blobUrl } = createDownloadAnchor(blob, { filename })
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
  }, 100)
}

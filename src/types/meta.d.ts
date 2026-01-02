import type { ApiMeta } from '@/utils/api'
import type { EStatus } from './enum'

export type TStatus = {
  type?: EStatus.Error | EStatus.Success | EStatus.Info | EStatus.Warning
}

export type TMetaData<T> = {
  meta: ApiMeta
  data: T
}

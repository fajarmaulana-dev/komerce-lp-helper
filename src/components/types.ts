import type { ComponentPropsWithRef, ReactNode } from 'react'

import type { TChildren } from '@/types'

import type { TLazyBackground } from './hooks'

export type TFormProps = {
  action: (formData: FormData) => void
} & ComponentPropsWithRef<'form'> &
  TChildren

export type TLazyBackgroundProps = {
  children?: ReactNode
} & TLazyBackground &
  ComponentPropsWithRef<'div'>

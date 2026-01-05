import type { ComponentPropsWithRef, ReactNode } from 'react'

import type { TChildren } from '@/types'

import type { TLazyBackground } from './hooks'

type TFormProps = {
  action: (formData: FormData) => void
} & ComponentPropsWithRef<'form'> &
  TChildren

type TLazyBackgroundProps = {
  children?: ReactNode
} & TLazyBackground &
  ComponentPropsWithRef<'div'>

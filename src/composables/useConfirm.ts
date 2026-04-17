import { ref } from 'vue'

export type ConfirmType = 'default' | 'danger'

export interface ConfirmOptions {
  title?: string
  message: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmType
  closeOnClickOverlay?: boolean
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'description'>> {
  description: string | null
}

interface PendingResolver {
  resolve: (value: boolean) => void
}

const DEFAULTS: ConfirmState = {
  title: '确认操作',
  message: '',
  description: null,
  confirmText: '确认',
  cancelText: '取消',
  type: 'default',
  closeOnClickOverlay: true,
}

const visible = ref(false)
const state = ref<ConfirmState>({ ...DEFAULTS })
const loading = ref(false)
let pending: PendingResolver | null = null

function settle(value: boolean) {
  const p = pending
  pending = null
  visible.value = false
  loading.value = false
  p?.resolve(value)
}

export function useConfirmDialogState() {
  return { visible, state, loading }
}

export function confirmCancel() {
  if (loading.value) return
  settle(false)
}

export function confirmAccept() {
  settle(true)
}

export function setConfirmLoading(value: boolean) {
  loading.value = value
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  // 已有未关闭的确认框时，先把上一次按「取消」处理，避免互相覆盖。
  if (pending) settle(false)

  state.value = {
    ...DEFAULTS,
    ...options,
    description: options.description ?? null,
  }
  visible.value = true

  return new Promise<boolean>((resolve) => {
    pending = { resolve }
  })
}

export function useConfirm() {
  return { confirm }
}

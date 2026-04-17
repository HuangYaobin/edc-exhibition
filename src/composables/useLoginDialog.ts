import { ref } from 'vue'

interface PendingResolver {
  resolve: () => void
  reject: (reason?: unknown) => void
}

const visible = ref(false)
let pending: PendingResolver | null = null

export function openLoginDialog(): Promise<void> {
  if (pending) {
    return new Promise<void>((resolve, reject) => {
      const prev = pending!
      pending = {
        resolve: () => {
          prev.resolve()
          resolve()
        },
        reject: (reason) => {
          prev.reject(reason)
          reject(reason)
        },
      }
      visible.value = true
    })
  }

  return new Promise<void>((resolve, reject) => {
    pending = { resolve, reject }
    visible.value = true
  })
}

export function resolveLoginDialog() {
  const p = pending
  pending = null
  visible.value = false
  p?.resolve()
}

export function rejectLoginDialog(reason: unknown = new Error('login_cancelled')) {
  const p = pending
  pending = null
  visible.value = false
  p?.reject(reason)
}

export function useLoginDialogState() {
  return {
    visible,
  }
}

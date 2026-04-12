// Lightweight composable wrapper for Element Plus ElMessage with SSR-safe dynamic import

type MessageType = 'success' | 'warning' | 'info' | 'error'

let elMessageModulePromise: Promise<any> | null = null

function isClientEnvironment(): boolean {
  return typeof window !== 'undefined'
}

async function loadElMessage(): Promise<any> {
  if (!isClientEnvironment()) return null
  if (!elMessageModulePromise) {
    // Import only the message submodule to avoid pulling unnecessary deps
    elMessageModulePromise = import('element-plus/es/components/message/index').catch((error) => {
      console.error('Failed to dynamically import ElMessage module:', error)
      throw error
    })
  }
  const mod = await elMessageModulePromise
  return (mod as any).ElMessage || (mod as any).default
}

function callMessage(type: MessageType, message: string, options?: Record<string, any>): void {
  if (!isClientEnvironment()) return
  loadElMessage()
    .then((ElMessage) => {
      if (!ElMessage) return
      if (typeof ElMessage[type] === 'function') {
        ElMessage[type](message, options)
      } else if (typeof ElMessage === 'function') {
        ElMessage({ type, message, ...(options || {}) })
      }
    })
    .catch((error) => {
      console.error('ElMessage invocation failed:', error)
    })
}

function showMessage(options: string | { message: string } & Record<string, any>): void {
  if (!isClientEnvironment()) return
  loadElMessage()
    .then((ElMessage) => {
      if (!ElMessage) return
      if (typeof options === 'string') {
        ElMessage({ message: options })
      } else {
        ElMessage(options)
      }
    })
    .catch((error) => {
      console.error('ElMessage show failed:', error)
    })
}

export function useMessage() {
  return {
    show: showMessage,
    success: (msg: string, options?: Record<string, any>) => callMessage('success', msg, options),
    warning: (msg: string, options?: Record<string, any>) => callMessage('warning', msg, options),
    info: (msg: string, options?: Record<string, any>) => callMessage('info', msg, options),
    error: (msg: string, options?: Record<string, any>) => callMessage('error', msg, options),
  }
}


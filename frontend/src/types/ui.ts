export type Notice = {
  type: 'success' | 'error'
  message: string
}

export type DialogState =
  | {
      kind: 'input'
      title: string
      label: string
      confirmLabel: string
      defaultValue?: string
      onConfirm: (value: string) => Promise<void>
    }
  | {
      kind: 'confirm'
      title: string
      description: string
      confirmLabel: string
      onConfirm: () => Promise<void>
    }

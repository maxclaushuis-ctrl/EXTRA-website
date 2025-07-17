// Simple toast placeholder - using console for now
export function Toaster() {
  return null
}

export const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
}
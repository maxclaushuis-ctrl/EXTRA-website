// Simple toast hook placeholder
export function useToast() {
  return {
    toast: (options: { title?: string; description?: string; variant?: string }) => {
      console.log('Toast:', options)
    }
  }
}
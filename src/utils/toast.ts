// Simple toast notification utility
export const toast = {
  success: (message: string) => {
    console.log("[Success]", message)
    alert(message)
  },
  error: (message: string) => {
    console.log("[Error]", message)
    alert("Error: " + message)
  },
  info: (message: string) => {
    console.log("[Info]", message)
  },
}

export function ToastContainer() {
  return null
}

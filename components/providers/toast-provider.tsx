"use client"

import { Toaster } from "react-hot-toast"

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: "var(--surface-1)",
          color: "var(--fg)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "16px",
          fontSize: "14px",
          fontFamily: "var(--font-mono)",
        },
        // Success toast style
        success: {
          iconTheme: {
            primary: "var(--accent)",
            secondary: "var(--surface-1)",
          },
          style: {
            border: "1px solid var(--accent)",
          },
        },
        // Error toast style
        error: {
          iconTheme: {
            primary: "var(--error)",
            secondary: "var(--surface-1)",
          },
          style: {
            border: "1px solid var(--error)",
          },
        },
      }}
    />
  )
}

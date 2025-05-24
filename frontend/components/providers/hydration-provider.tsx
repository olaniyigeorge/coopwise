"use client"

import { useEffect } from 'react'

interface HydrationProviderProps {
  children: React.ReactNode
}

/**
 * Provider that handles browser extension hydration issues
 * Should be used at the root level of the application
 */
export function HydrationProvider({ children }: HydrationProviderProps) {
  useEffect(() => {
    // Suppress React hydration warnings for browser extension attributes
    const originalError = console.error
    
    console.error = (...args) => {
      // Suppress specific hydration warnings caused by browser extensions
      const message = String(args[0] || '')
      if (
        message.includes('Hydration failed') ||
        message.includes('server HTML') ||
        message.includes('client') ||
        message.includes('bis_skin_checked') ||
        message.includes('bis_register') ||
        message.includes('__processed_')
      ) {
        return
      }
      originalError(...args)
    }

    // Clean up browser extension attributes
    const cleanupExtensionAttributes = () => {
      if (typeof window === 'undefined') return

      const extensionAttributes = [
        'bis_skin_checked',
        'bis_register',
        'data-safesearch',
        'data-grammarly-shadow-root',
        'data-ms-editor',
        'data-1p-ignore',
        'data-lastpass-icon-root'
      ]

      const allElements = document.querySelectorAll('*')
      allElements.forEach(element => {
        extensionAttributes.forEach(attr => {
          if (element.hasAttribute(attr)) {
            element.removeAttribute(attr)
          }
        })
        
        // Remove attributes that start with common extension prefixes
        const attributes = Array.from(element.attributes)
        attributes.forEach(({ name }) => {
          if (
            name.startsWith('__processed_') ||
            name.startsWith('data-bit-') ||
            name.startsWith('data-1p-') ||
            name.startsWith('data-lastpass-') ||
            name.startsWith('data-grammarly-')
          ) {
            element.removeAttribute(name)
          }
        })
      })
    }

    // Run cleanup after initial hydration
    const cleanup = () => {
      cleanupExtensionAttributes()
      setTimeout(cleanupExtensionAttributes, 1000) // Run again after 1 second
    }

    // Run cleanup when DOM is ready
    if (document.readyState === 'complete') {
      cleanup()
    } else {
      window.addEventListener('load', cleanup)
    }

    // Restore original console.error when component unmounts
    return () => {
      console.error = originalError
      window.removeEventListener('load', cleanup)
    }
  }, [])

  return <>{children}</>
} 
import { useEffect, useState } from 'react'

/**
 * Hook to handle hydration issues caused by browser extensions
 * This prevents hydration mismatches when extensions inject attributes
 */
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Hook to clean up browser extension attributes that cause hydration issues
 */
export function useBrowserExtensionCleanup() {
  useEffect(() => {
    // List of known browser extension attributes that cause hydration issues
    const extensionAttributes = [
      'bis_skin_checked',
      'bis_register',
      'data-safesearch',
      'data-grammarly-shadow-root',
      'spellcheck',
      'data-ms-editor',
      'data-1p-ignore',
      'data-lastpass-icon-root'
    ]

    // Clean up extension attributes from all elements
    const cleanupExtensionAttributes = () => {
      const allElements = document.querySelectorAll('*')
      allElements.forEach(element => {
        extensionAttributes.forEach(attr => {
          if (element.hasAttribute(attr)) {
            element.removeAttribute(attr)
          }
        })
        
        // Also remove attributes that start with common extension prefixes
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

    // Run cleanup after DOM is loaded and hydration is complete
    const timer = setTimeout(cleanupExtensionAttributes, 100)

    // Also run on mutation observer for dynamic content
    const observer = new MutationObserver(() => {
      cleanupExtensionAttributes()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])
} 
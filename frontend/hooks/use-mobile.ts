"use client"

import { useState, useEffect } from 'react'

interface BreakpointConfig {
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export function useBreakpoint(breakpoints: BreakpointConfig = defaultBreakpoints) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof BreakpointConfig | 'xs'>('xs')
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({ width, height })

      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl')
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl')
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg')
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md')
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm')
      } else {
        setCurrentBreakpoint('xs')
      }
    }

    // Set initial values
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoints])

  return {
    currentBreakpoint,
    windowSize,
    isXs: currentBreakpoint === 'xs',
    isSm: currentBreakpoint === 'sm',
    isMd: currentBreakpoint === 'md',
    isLg: currentBreakpoint === 'lg',
    isXl: currentBreakpoint === 'xl',
    is2Xl: currentBreakpoint === '2xl',
    isMobile: currentBreakpoint === 'xs' || currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md',
    isDesktop: currentBreakpoint === 'lg' || currentBreakpoint === 'xl' || currentBreakpoint === '2xl',
    isSmallScreen: currentBreakpoint === 'xs' || currentBreakpoint === 'sm' || currentBreakpoint === 'md'
  }
}

export function useMobile() {
  const { isMobile, isSmallScreen, currentBreakpoint, windowSize } = useBreakpoint()
  
  return {
    isMobile,
    isSmallScreen,
    currentBreakpoint,
    windowSize,
    // Utility functions
    getResponsiveValue: <T>(values: { mobile?: T; tablet?: T; desktop?: T; default: T }) => {
      if (isMobile && values.mobile !== undefined) return values.mobile
      if (currentBreakpoint === 'md' && values.tablet !== undefined) return values.tablet
      if (!isMobile && !isSmallScreen && values.desktop !== undefined) return values.desktop
      return values.default
    },
    // Grid columns helper
    getGridCols: (config: { mobile?: number; tablet?: number; desktop?: number }) => {
      if (isMobile) return config.mobile || 1
      if (currentBreakpoint === 'md') return config.tablet || 2
      return config.desktop || 3
    },
    // Spacing helper
    getSpacing: (config: { mobile?: string; tablet?: string; desktop?: string }) => {
      if (isMobile) return config.mobile || 'space-y-3'
      if (currentBreakpoint === 'md') return config.tablet || 'space-y-4'
      return config.desktop || 'space-y-6'
    }
  }
}

export function useResponsiveColumns(
  mobileColumns: number = 1,
  tabletColumns: number = 2,
  desktopColumns: number = 3
) {
  const { isMobile, currentBreakpoint } = useBreakpoint()
  
  if (isMobile) return mobileColumns
  if (currentBreakpoint === 'md') return tabletColumns
  return desktopColumns
}

export function useResponsiveSpacing() {
  const { isMobile, currentBreakpoint } = useBreakpoint()
  
  return {
    cardPadding: isMobile ? 'p-3' : currentBreakpoint === 'md' ? 'p-4' : 'p-6',
    sectionSpacing: isMobile ? 'space-y-3' : currentBreakpoint === 'md' ? 'space-y-4' : 'space-y-6',
    gridGap: isMobile ? 'gap-3' : currentBreakpoint === 'md' ? 'gap-4' : 'gap-6',
    buttonSize: isMobile ? 'text-sm px-3 py-2' : 'text-base px-4 py-2'
  }
} 
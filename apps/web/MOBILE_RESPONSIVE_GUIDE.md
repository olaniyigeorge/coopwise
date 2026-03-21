# Mobile Responsive Dashboard Guide

This guide documents the mobile responsiveness improvements made to the CoopWise dashboard, including reusable components, utilities, and best practices.

## Overview

The dashboard has been completely redesigned to be mobile-first and responsive across all screen sizes. Key improvements include:

- **Mobile-first design approach** with progressive enhancement
- **Responsive navigation** with mobile sidebar and bottom navigation
- **Reusable responsive components** for consistent behavior
- **Custom hooks** for responsive utilities
- **Optimized layouts** for touch interfaces

## Breakpoints

The dashboard uses the following responsive breakpoints:

```typescript
{
  xs: 0-639px     // Mobile phones
  sm: 640-767px   // Large mobile phones
  md: 768-1023px  // Tablets
  lg: 1024-1279px // Small desktops
  xl: 1280-1535px // Large desktops
  2xl: 1536px+    // Extra large screens
}
```

## Core Components

### 1. Layout System

#### DashboardLayout (`components/dashboard/layout.tsx`)
- **Mobile sidebar**: Slide-out navigation with backdrop
- **Responsive header**: Collapsible elements and mobile menu button
- **Bottom navigation**: Mobile-only bottom tab bar
- **Proper spacing**: Responsive padding and margins

```tsx
// Usage
<DashboardLayout>
  <YourPageContent />
</DashboardLayout>
```

#### Sidebar (`components/dashboard/sidebar.tsx`)
- **Desktop**: Fixed sidebar with full navigation
- **Mobile**: Slide-out overlay with close button
- **Auto-close**: Closes when navigation link is clicked on mobile

#### Header (`components/dashboard/header.tsx`)
- **Mobile menu button**: Shows/hides mobile sidebar
- **Responsive title**: Truncates on small screens
- **Adaptive user profile**: Hides username on mobile

#### MobileBottomNav (`components/dashboard/mobile-bottom-nav.tsx`)
- **Mobile-only**: Hidden on desktop (lg+)
- **5-tab layout**: Home, Groups, Contributions, AI Insights, Messages
- **Badge support**: Shows notification counts
- **Active states**: Visual indicators for current page

### 2. Responsive Utilities

#### Mobile Responsive Wrapper (`components/dashboard/mobile-responsive-wrapper.tsx`)

Collection of reusable components for consistent responsive behavior:

```tsx
// Basic wrapper with responsive spacing
<MobileResponsiveWrapper variant="section" spacing="md">
  <YourContent />
</MobileResponsiveWrapper>

// Responsive card with header
<MobileCard 
  title="Card Title" 
  subtitle="Optional subtitle"
  actions={<Button>Action</Button>}
>
  <CardContent />
</MobileCard>

// Responsive grid
<MobileGrid cols={{ base: 1, sm: 2, lg: 3 }}>
  <GridItem />
  <GridItem />
</MobileGrid>

// Responsive stack
<MobileStack direction="responsive" spacing="md">
  <StackItem />
  <StackItem />
</MobileStack>
```

#### Custom Hooks (`hooks/use-mobile.ts`)

Responsive utilities for dynamic behavior:

```tsx
import { useMobile, useResponsiveColumns, useResponsiveSpacing } from '@/hooks/use-mobile'

function MyComponent() {
  const { isMobile, getResponsiveValue, getGridCols } = useMobile()
  const columns = useResponsiveColumns(1, 2, 4)
  const { cardPadding, sectionSpacing } = useResponsiveSpacing()
  
  const buttonText = getResponsiveValue({
    mobile: 'Add',
    desktop: 'Add New Item',
    default: 'Add'
  })
  
  return (
    <div className={`grid grid-cols-${columns} ${sectionSpacing}`}>
      {/* Content */}
    </div>
  )
}
```

## Page-Specific Improvements

### Dashboard Overview (`components/dashboard/overview.tsx`)
- **Responsive stats cards**: 1 column on mobile, 2 on tablet, 4 on desktop
- **Flexible action buttons**: Stack vertically on mobile
- **Adaptive content**: Shorter text and smaller icons on mobile
- **Progressive disclosure**: Less information shown on smaller screens

### Contributions Page (`app/dashboard/contributions/page.tsx`)
- **Mobile-optimized filters**: Collapsible filter panel
- **Responsive grid/list toggle**: Adapts to screen size
- **Touch-friendly controls**: Larger tap targets
- **Simplified pagination**: Condensed on mobile

### AI Insights Summary (`components/dashboard/ai-insights-summary.tsx`)
- **Compact layout**: Reduced padding and spacing on mobile
- **Responsive stats grid**: 3 columns with smaller icons
- **Truncated content**: Prevents overflow on small screens

## Best Practices

### 1. Mobile-First Approach
Always start with mobile styles and enhance for larger screens:

```css
/* Mobile first */
.component {
  @apply p-3 text-sm;
}

/* Tablet and up */
.component {
  @apply sm:p-4 sm:text-base;
}

/* Desktop and up */
.component {
  @apply lg:p-6 lg:text-lg;
}
```

### 2. Touch-Friendly Design
- **Minimum tap target**: 44px (11 Tailwind units)
- **Adequate spacing**: Prevent accidental taps
- **Clear visual feedback**: Hover and active states

```tsx
<Button className="min-h-11 min-w-11 p-3 sm:p-4">
  <Icon className="w-5 h-5" />
</Button>
```

### 3. Content Prioritization
Show the most important content first on mobile:

```tsx
// Desktop: Show all details
// Mobile: Show essential info only
<div className="space-y-2">
  <h3 className="font-medium">{title}</h3>
  <p className="text-sm text-gray-600 hidden sm:block">{description}</p>
  <div className="flex items-center gap-2">
    <Badge>{status}</Badge>
    <span className="text-xs text-gray-500 sm:hidden">{shortDate}</span>
    <span className="text-sm text-gray-500 hidden sm:inline">{fullDate}</span>
  </div>
</div>
```

### 4. Responsive Typography
Use responsive text sizing consistently:

```tsx
// Headings
<h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">
<h2 className="text-base sm:text-lg font-medium">
<h3 className="text-sm sm:text-base font-medium">

// Body text
<p className="text-sm sm:text-base text-gray-700">

// Captions
<span className="text-xs sm:text-sm text-gray-500">
```

### 5. Responsive Spacing
Use consistent spacing patterns:

```tsx
// Sections
<div className="space-y-4 sm:space-y-6 lg:space-y-8">

// Cards
<div className="p-3 sm:p-4 lg:p-6">

// Grids
<div className="grid gap-3 sm:gap-4 lg:gap-6">
```

## Testing Responsive Design

### 1. Browser DevTools
- Test all major breakpoints (320px, 768px, 1024px, 1440px)
- Verify touch interactions work properly
- Check for horizontal scrolling issues

### 2. Real Devices
- Test on actual mobile devices when possible
- Verify performance on slower devices
- Check touch responsiveness and gesture support

### 3. Accessibility
- Ensure minimum touch target sizes (44px)
- Test with screen readers
- Verify keyboard navigation works on all screen sizes

## Common Patterns

### Responsive Navigation
```tsx
// Desktop: Always visible sidebar
// Mobile: Hamburger menu + bottom navigation
<div className="lg:ml-[208px]">
  <Header onMenuClick={() => setSidebarOpen(true)} />
  <main className="pb-20 lg:pb-6">
    {children}
  </main>
</div>
<MobileBottomNav />
```

### Responsive Cards
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
  {items.map(item => (
    <Card key={item.id} className="p-3 sm:p-4 lg:p-6">
      <CardContent />
    </Card>
  ))}
</div>
```

### Responsive Forms
```tsx
<form className="space-y-4 sm:space-y-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Input placeholder="First Name" />
    <Input placeholder="Last Name" />
  </div>
  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
    <Button type="submit" className="w-full sm:w-auto">
      Submit
    </Button>
    <Button type="button" variant="outline" className="w-full sm:w-auto">
      Cancel
    </Button>
  </div>
</form>
```

## Performance Considerations

### 1. Conditional Rendering
Only render mobile-specific components when needed:

```tsx
const { isMobile } = useMobile()

return (
  <div>
    {isMobile ? <MobileComponent /> : <DesktopComponent />}
  </div>
)
```

### 2. Image Optimization
Use responsive images with appropriate sizes:

```tsx
<Image
  src="/image.jpg"
  alt="Description"
  width={isMobile ? 300 : 600}
  height={isMobile ? 200 : 400}
  className="w-full h-auto"
/>
```

### 3. Lazy Loading
Implement lazy loading for off-screen content:

```tsx
<div className="space-y-4">
  {visibleItems.map(item => <ItemCard key={item.id} item={item} />)}
  {hasMore && <LoadMoreButton />}
</div>
```

## Future Enhancements

1. **Progressive Web App (PWA)** features
2. **Offline support** for core functionality
3. **Advanced gestures** (swipe, pinch-to-zoom)
4. **Adaptive layouts** based on device capabilities
5. **Performance monitoring** for mobile devices

## Troubleshooting

### Common Issues

1. **Horizontal scrolling**: Check for fixed widths or missing responsive classes
2. **Touch targets too small**: Ensure minimum 44px touch targets
3. **Text too small**: Use responsive typography classes
4. **Layout breaks**: Test at all breakpoints, especially edge cases
5. **Performance issues**: Optimize images and reduce JavaScript bundle size

### Debug Tools

```tsx
// Add this component for debugging responsive behavior
function ResponsiveDebugger() {
  const { currentBreakpoint, windowSize } = useMobile()
  
  return (
    <div className="fixed top-0 right-0 bg-black text-white p-2 text-xs z-50">
      {currentBreakpoint} - {windowSize.width}x{windowSize.height}
    </div>
  )
}
```

This comprehensive mobile responsiveness system ensures the CoopWise dashboard provides an excellent user experience across all devices and screen sizes. 
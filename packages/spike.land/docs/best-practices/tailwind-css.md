# Tailwind CSS Best Practices Guide

A comprehensive guide to writing maintainable, performant, and well-organized
Tailwind CSS code. This document covers configuration, component patterns,
responsive design, dark mode, performance optimization, and organization
strategies.

## Table of Contents

1. [Configuration](#configuration)
2. [Component Patterns](#component-patterns)
3. [Responsive Design](#responsive-design)
4. [Dark Mode Implementation](#dark-mode-implementation)
5. [Performance Optimization](#performance-optimization)
6. [Organization & Ordering](#organization--ordering)
7. [Common Pitfalls](#common-pitfalls)

---

## Configuration

### Custom Theme Setup

Tailwind v4 uses a CSS-first configuration model with the `@theme` directive.
Define your design tokens once and consume them across your project.

#### Basic Theme Configuration

```css
/* globals.css or main entry point */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-primary-dark: #1e40af;
  --color-secondary: #8b5cf6;

  --font-family-sans: "Geist Sans", system-ui, sans-serif;
  --font-family-mono: "Geist Mono", monospace;

  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-base: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 4rem;

  --radius-sm: 0.25rem;
  --radius-base: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```

#### Extending Default Theme (Legacy Config)

If using `tailwind.config.js` for backward compatibility:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          900: "#1e3a8a",
        },
        secondary: {
          500: "#8b5cf6",
          900: "#5b21b6",
        },
      },
      fontFamily: {
        sans: ["Geist Sans", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        base: "1rem",
        md: "1.5rem",
        lg: "2rem",
      },
      borderRadius: {
        sm: "0.25rem",
        base: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
```

**Key Principle**: Always use `extend` instead of replacing `theme` entirely.
This preserves Tailwind's default values and prevents breaking existing
utilities.

### Using Plugins

Tailwind's plugin ecosystem provides pre-built solutions for common styling
needs:

#### Official Plugins

```javascript
plugins: [
  // Forms: Better default styles for form elements
  require("@tailwindcss/forms"),

  // Typography: Beautiful default styles for prose content
  require("@tailwindcss/typography"),

  // Line Clamp: Multi-line text truncation
  require("@tailwindcss/line-clamp"),

  // Aspect Ratio: Maintain aspect ratios for media
  require("@tailwindcss/aspect-ratio"),
];
```

#### Creating Custom Plugins

```javascript
function customPlugin({ addBase, addComponents, addUtilities, theme }) {
  // Add base styles
  addBase({
    "h1": {
      fontSize: theme("fontSize.4xl"),
      fontWeight: theme("fontWeight.bold"),
    },
  });

  // Add component classes
  addComponents({
    ".btn-primary": {
      padding: theme("spacing.2"),
      borderRadius: theme("borderRadius.md"),
      backgroundColor: theme("colors.blue.500"),
      color: theme("colors.white"),
      "&:hover": {
        backgroundColor: theme("colors.blue.600"),
      },
    },
  });

  // Add custom utilities
  addUtilities({
    ".text-shadow": {
      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)",
    },
  });
}

module.exports = customPlugin;
```

### Content Purging Configuration

Ensure Tailwind scans the correct files to avoid unused CSS bloat:

```javascript
export default {
  content: [
    "./src/**/*.{ts,tsx,jsx,js}",
    "./src/**/*.mdx",
    // Important: Include all template files
  ],
  theme: {/* ... */},
  plugins: [],
};
```

**Critical**: Misconfigured content paths result in megabytes of unnecessary
CSS. Double-check these paths match your project structure.

---

## Component Patterns

### Class Variance Authority (CVA)

CVA provides a type-safe, composable way to manage component variants. It
eliminates long conditional classname strings and provides autocompletion.

#### Installation

```bash
npm install class-variance-authority clsx tailwind-merge
```

#### Basic Button Component

```typescript
// src/components/button.ts
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // Base styles applied to all variants
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-400",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        outline:
          "border border-gray-300 text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-400",
        ghost: "text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-400",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10",
      },
    },
    // Default values when no variant is specified
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

#### Advanced: Compound Variants

```typescript
const cardVariants = cva("rounded-lg border p-4", {
  variants: {
    intent: {
      info: "border-blue-200 bg-blue-50",
      success: "border-green-200 bg-green-50",
      warning: "border-yellow-200 bg-yellow-50",
      danger: "border-red-200 bg-red-50",
    },
    elevated: {
      true: "shadow-lg",
      false: "shadow-none",
    },
  },
  compoundVariants: [
    // When elevated is true, increase shadow intensity based on intent
    {
      elevated: true,
      intent: "info",
      className: "shadow-blue-100",
    },
    {
      elevated: true,
      intent: "danger",
      className: "shadow-red-100",
    },
  ],
  defaultVariants: {
    intent: "info",
    elevated: false,
  },
});
```

### Using @apply for Shared Styles

Use `@apply` strategically only when true duplication exists:

```css
/* ✅ Good: Shared component used in multiple places */
@layer components {
  .card {
    @apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm;
  }

  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white font-medium rounded-md
      hover:bg-blue-700 transition-colors;
  }
}
```

```css
/* ❌ Avoid: Premature abstraction for single-use styles */
@layer components {
  .home-hero-title {
    @apply text-4xl font-bold text-gray-900;
  }
}
/* Better: Use a component with CVA or styled inline */
```

### Component Extraction Pattern

When to extract components:

| Scenario                      | Approach                      |
| ----------------------------- | ----------------------------- |
| **Reused in 3+ places**       | Extract with CVA or component |
| **Complex interaction logic** | React component               |
| **Just styling, single use**  | Inline classes                |
| **Consistent brand style**    | @apply or component           |

---

## Responsive Design

### Mobile-First Approach

Tailwind uses a mobile-first strategy: unprefixed utilities apply to all screen
sizes, prefixed utilities override at specific breakpoints.

```html
<!-- Good: Mobile first, then progressive enhancement -->
<div class="flex flex-col gap-4 md:flex-row md:gap-8 lg:gap-12">
  <aside class="w-full md:w-1/4">Sidebar</aside>
  <main class="w-full md:w-3/4">Content</main>
</div>
```

```html
<!-- ❌ Bad: Desktop-first thinking -->
<div class="flex-row gap-12 sm:flex-col sm:gap-4">
  <!-- This approach fights against Tailwind's design -->
</div>
```

### Default Breakpoints

Tailwind provides six breakpoints optimized for responsive design:

```javascript
// Default breakpoints (in tailwind.config.js if customizing)
screens: {
  'sm': '640px',   // Tablets in portrait
  'md': '768px',   // Tablets in landscape
  'lg': '1024px',  // Small laptops
  'xl': '1280px',  // Large laptops
  '2xl': '1536px', // Wide screens
  // No 'xs' prefix for mobile - use unprefixed classes
}
```

### Responsive Class Ordering

Always prefix responsive variants clearly to show which breakpoint they apply
to:

```html
<!-- ✅ Good: Clear which classes apply at which breakpoints -->
<img class="w-16 md:w-32 lg:w-48" src="..." alt="..." />

<div class="block lg:flex lg:flex-col lg:justify-center">
  Content that's block on mobile, flex column on lg+
</div>
```

```html
<!-- ❌ Bad: Unclear which utilities apply where -->
<img class="w-16 md:w-32 w-48" src="..." alt="..." />

<div class="block flex flex-col lg:flex lg:flex-col lg:justify-center">
  Confusing to parse
</div>
```

### Targeting Breakpoint Ranges

Apply styles only within a specific range:

```html
<!-- Show sidebar only on md:xl screens -->
<aside class="hidden md:block xl:hidden">
  Navigation sidebar
</aside>

<!-- Equivalent using max-* variants -->
<div class="lg:flex max-lg:hidden">
  Desktop layout
</div>
```

### Custom Breakpoints

Add custom breakpoints when design requirements demand:

```javascript
export default {
  theme: {
    screens: {
      "xs": "320px", // Extra small phones
      "sm": "640px", // Standard mobile
      "md": "768px", // Tablets
      "lg": "1024px", // Small laptops
      "xl": "1280px", // Large laptops
      "2xl": "1536px", // Ultra-wide
      "3xl": "1920px", // 4K displays
    },
  },
};
```

**Guideline**: Avoid too many custom breakpoints. Stick to defaults unless
design specifications require otherwise.

---

## Dark Mode Implementation

### Strategy Selection

Tailwind supports three dark mode strategies:

#### 1. Media Strategy (System Preference)

```javascript
// tailwind.config.js
export default {
  darkMode: "media", // Default
};
```

```html
<!-- Automatically responds to OS dark mode preference -->
<button class="bg-white dark:bg-gray-900 text-black dark:text-white">
  Toggle Theme
</button>
```

**Pros**: No JavaScript required, respects user OS preference **Cons**: Users
can't manually override their system preference

#### 2. Selector Strategy (Manual Control)

```javascript
// tailwind.config.js
export default {
  darkMode: "selector",
};
```

```javascript
// hooks/use-theme.ts
'use client';

import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    const initial = stored || systemTheme;
    setTheme(initial);
    updateDOM(initial);
  }, []);

  const toggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    updateDOM(newTheme);
  };

  return { theme, toggle };
}

function updateDOM(theme: 'light' | 'dark') {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}
```

```html
<!-- Apply dark class on html element -->
<html class="dark">
  <button class="bg-white dark:bg-gray-900">Toggle Theme</button>
</html>
```

**Pros**: Full user control, manual override support **Cons**: Requires
JavaScript, potential flicker on initial load

#### 3. Data Attribute Strategy

```javascript
// tailwind.config.js
export default {
  darkMode: ["selector", "[data-theme=\"dark\"]"],
};
```

```html
<html data-theme="dark">
  <button class="bg-white dark:bg-gray-900">Toggle Theme</button>
</html>
```

**Pros**: Cleaner HTML attribute approach **Cons**: Still requires JavaScript

### Preventing Dark Mode Flash

Avoid the flicker when dark mode loads by initializing theme in a script tag:

```typescript
// Root layout or before hydration
const themeScript = `
  (function() {
    const theme = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  })();
`;
```

In Next.js with App Router:

```typescript
// src/app/layout.tsx
export default function RootLayout(
  { children }: { children: React.ReactNode; },
) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') ||
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Using CSS Variables for Themes

Combine CSS variables with dark mode for more flexibility:

```css
/* globals.css */
@layer base {
  :root {
    --color-primary: rgb(59, 130, 246); /* blue-500 */
    --color-primary-foreground: rgb(255, 255, 255);
    --color-secondary: rgb(139, 92, 246); /* violet-500 */
    --color-background: rgb(255, 255, 255);
    --color-foreground: rgb(15, 23, 42);
  }
}
```

```css
/* Use variables in Tailwind */
@layer components {
  .btn-primary {
    @apply px-4 py-2 rounded-md font-medium transition-colors;
    background-color: var(--color-primary);
    color: var(--color-primary-foreground);
  }
}
```

---

## Performance Optimization

### Bundle Size Reduction

Tailwind aims to produce the smallest CSS file possible by only generating used
styles.

#### Current Benchmarks

- **Tailwind v4**: 8-15 KB gzipped for production builds
- **Tailwind v3**: Typically 10-20 KB gzipped
- **Netflix Top 10** (Tailwind-powered): 6.5 KB CSS over network

#### Optimization Strategies

1. **Correct Content Paths**

```javascript
// ✅ Good: Accurate, specific paths
export default {
  content: [
    "./src/**/*.{ts,tsx,jsx,js}",
    "./src/components/**/*.{ts,tsx}",
    "!./src/**/*.test.{ts,tsx}", // Exclude tests
  ],
};

// ❌ Avoid: Overly broad patterns
export default {
  content: [
    "./**/*.{ts,tsx}", // Scans entire project, slow builds
  ],
};
```

2. **Minimize @apply Usage**

```css
/* ✅ Good: Limited @apply for true components */
@layer components {
  .card {
    @apply rounded-lg border border-gray-200 p-4;
  }
}

/* ❌ Avoid: Excessive @apply defeats Tailwind's benefits */
@layer utilities {
  .flex-center {
    @apply flex items-center justify-center;
  }
  .text-muted {
    @apply text-gray-500;
  }
  /* This duplicates Tailwind's utilities */
}
```

3. **Tree-Shaking Unused Styles**

Tailwind automatically removes unused styles in production:

```bash
# Development: Full CSS (~100+ KB)
yarn dev

# Production: Only used styles (~10-15 KB)
yarn build
```

4. **CSS Minification**

```javascript
// tailwind.config.js
export default {
  // Minification is automatic in production
  // For custom minification, use PostCSS plugins
  plugins: [
    require("cssnano")({
      preset: ["default", { discardComments: { removeAll: true } }],
    }),
  ],
};
```

### Code Splitting

For large applications, consider splitting CSS per page:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    optimizeCss: true, // Enables automatic CSS optimization
  },
};

module.exports = config;
```

### Monitoring Bundle Size

```bash
# Check production CSS size
yarn build
ls -lh .next/static/css/

# Use webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer
```

---

## Organization & Ordering

### Class Ordering Pattern

Order classes using the "Concentric CSS" approach for consistency:

```html
<!-- Pattern: Positioning → Box Model → Borders → Backgrounds → Typography → Effects -->
<div
  class="
    /* Positioning & Display */
    relative flex items-center justify-center
    /* Box Model (margin, padding, dimensions) */
    mx-auto my-4 px-4 py-6 w-full max-w-2xl
    /* Borders & Shadows */
    border border-gray-200 rounded-lg shadow-md
    /* Background & Colors */
    bg-white
    /* Typography */
    text-center text-lg font-semibold text-gray-900
    /* Effects & Transitions */
    transition-all hover:shadow-lg active:shadow-none
  "
>
  Content
</div>
```

### Utility Class Grouping

Group related utilities for readability:

```html
<!-- Grouped for clarity -->
<div
  class="flex flex-col gap-4 items-center justify-between md:flex-row md:items-start"
>
  <!-- Group: flex container properties
       flex flex-col gap-4 items-center justify-between
       md:flex-row md:items-start
  -->
  Content
</div>
```

### Extracting Components

When classes become unwieldy, extract to components:

```typescript
// ❌ Cluttered component
export function Card({ title, children }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      {children}
    </div>
  );
}

// ✅ Clean component with CVA
const cardVariants = cva(
  "rounded-lg border bg-white transition-all",
  {
    variants: {
      variant: {
        default: "border-gray-200 shadow-sm hover:shadow-lg",
        elevated: "border-gray-300 shadow-md hover:shadow-xl",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Card({ title, children, variant }: Props) {
  return (
    <div className={cardVariants({ variant })}>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      {children}
    </div>
  );
}
```

---

## Common Pitfalls

### 1. Dynamic Class Names Don't Purge

**Problem**: Using template strings for class names prevents Tailwind's static
analysis:

```typescript
// ❌ BROKEN: Tailwind can't find these classes
const size = "md";
<div className={`w-${size}`}>Content</div>;

// ❌ BROKEN: Dynamic values aren't recognized
const margin = userInput;
<div className={`m-${margin}`}>Content</div>;
```

**Solution**: Use explicit class names or CVA:

```typescript
// ✅ GOOD: Static classes
const sizes = {
  sm: "w-16",
  md: "w-32",
  lg: "w-48",
};
<div className={sizes[size]}>Content</div>;

// ✅ GOOD: CVA handles variants
const divVariants = cva("w-16", {
  variants: {
    size: {
      sm: "w-16",
      md: "w-32",
      lg: "w-48",
    },
  },
});
<div className={divVariants({ size })}>Content</div>;
```

### 2. Incorrect Content Paths

**Problem**: CSS file bloats because Tailwind scans wrong directories:

```javascript
// ❌ BROKEN: Wrong paths
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}", // App Router is in app/
    "./src/**/*.{js,ts,jsx,tsx}", // But scanning src/ too
  ],
};

// ✅ GOOD: Accurate paths
export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
};
```

### 3. Over-Using @apply

**Problem**: Using `@apply` defeats the utility-first philosophy:

```css
/* ❌ Excessive @apply */
@layer utilities {
  .card-title {
    @apply text-xl font-bold text-gray-900 mb-2;
  }
  .card-body {
    @apply text-gray-600;
  }
  .button-base {
    @apply px-4 py-2 rounded font-medium transition;
  }
}

/* ✅ Strategic @apply */
@layer components {
  /* Only for components reused in 3+ places */
  .card {
    @apply rounded-lg border bg-white p-4 shadow-sm;
  }
}
```

### 4. Not Designing Mobile-First

**Problem**: Thinking desktop-first leads to confusing responsive code:

```html
<!-- ❌ Wrong: Desktop-first thinking -->
<div class="hidden lg:flex gap-8">
  <!-- Hidden by default, shown on lg? Confusing! -->
</div>

<!-- ✅ Right: Mobile-first design -->
<div class="flex gap-4 lg:gap-8">
  <!-- Visible on mobile with gap-4, adjusted to gap-8 on lg+ -->
</div>
```

### 5. Ignoring Accessibility

**Problem**: Tailwind doesn't fix semantic HTML or ARIA:

```html
<!-- ❌ Styled but inaccessible -->
<div class="cursor-pointer bg-blue-500 text-white p-4 rounded">
  Click me
</div>

<!-- ✅ Accessible button -->
<button
  type="button"
  class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
  aria-label="Submit form"
>
  Click me
</button>
```

**Guidelines**:

- Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- Include ARIA attributes when needed
- Ensure sufficient color contrast (WCAG AA minimum)
- Include focus states with `focus-visible:`
- Use `sr-only` for screen reader-only text

---

## Summary Checklist

- [ ] Configure theme using CSS variables (`@theme`) or `tailwind.config.js`
- [ ] Use plugins for common patterns (forms, typography)
- [ ] Verify `content` paths match your project structure
- [ ] Choose responsive strategy and implement mobile-first
- [ ] Select and implement dark mode strategy early
- [ ] Use CVA for reusable component variants
- [ ] Order classes consistently (positioning → box model → borders →
      backgrounds → typography → effects)
- [ ] Extract components only when truly reused
- [ ] Avoid dynamic class names - use explicit or CVA
- [ ] Test production build size (`yarn build && ls -lh .next/static/css/`)
- [ ] Ensure accessibility with semantic HTML and ARIA attributes
- [ ] Run Tailwind IntelliSense in IDE for autocomplete

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [CVA Documentation](https://cva.style/docs)
- [Tailwind CSS Best Practices 2025](https://benjamincrozat.com/tailwind-css)
- [Tailwind CSS Configuration Guide](https://tailwindcss.com/docs/configuration)
- [Dark Mode Implementation](https://tailwindcss.com/docs/dark-mode)
- [Responsive Design Guide](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS Performance Optimization](https://www.tailwindtap.com/blog/how-to-optimize-tailwind-css-for-performance-and-speed)
- [Class Variance Authority with Tailwind](https://fveracoechea.com/blog/cva-and-tailwind/)

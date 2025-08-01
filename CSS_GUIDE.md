# TastyTray CSS Architecture Guide

## Overview
This project uses a **centralized CSS system** built on top of Tailwind CSS. All reusable styles are defined in `src/index.css` using Tailwind's `@layer components` feature, making the codebase cleaner and more maintainable.

## Philosophy
- **No long className strings** in components
- **Semantic naming** that describes purpose, not appearance
- **Categorized organization** for easy discovery
- **Consistent design system** across all components

## CSS Categories

### 🏗️ Layout Components
```css
.page-container      /* Full page wrapper */
.main-content        /* Main content area with max-width */
.section-header      /* Section header spacing */
.grid-responsive     /* Responsive recipe grid */
.flex-center         /* Center items */
.flex-between        /* Space between items */
.space-items         /* Items with space */
```

### 🃏 Card Components
```css
.card               /* Basic white card */
.card-hover         /* Card with hover effects */
.card-content       /* Card padding */
.card-image         /* Recipe card image container */
.card-image-full    /* Full image styling */
```

### 🔘 Button Components
```css
.btn                /* Base button */
.btn-primary        /* Orange primary button */
.btn-secondary      /* Gray secondary button */
.btn-danger         /* Red danger button */
.btn-success        /* Green success button */
.btn-ghost          /* Transparent button */
.btn-icon           /* Icon button base */
.btn-icon-primary   /* Orange icon button */
.btn-icon-ghost     /* Transparent icon button */
.btn-disabled       /* Disabled state */
.btn-loading        /* Loading state */
```

### 📝 Form Components
```css
.input              /* Text input styling */
.select             /* Select dropdown */
.form-group         /* Form field container */
.form-label         /* Form field label */
.form-error         /* Error message styling */
```

### 🧭 Navigation Components
```css
.nav-container      /* Navigation wrapper */
.nav-content        /* Navigation content area */
.nav-header         /* Navigation header */
.nav-logo           /* Logo container */
.nav-brand          /* Brand elements */
.nav-title          /* TastyTray title */
.nav-menu           /* Desktop menu */
.nav-items          /* Menu items container */
.nav-item           /* Individual nav item */
.nav-item-active    /* Active nav item */
.nav-item-inactive  /* Inactive nav item */
.nav-mobile         /* Mobile navigation */
.nav-mobile-menu    /* Mobile menu container */
.nav-mobile-item    /* Mobile menu item */
```

### 📝 Text Components
```css
.heading-1          /* Large page titles */
.heading-2          /* Section headings */
.heading-3          /* Subsection headings */
.title              /* Component titles */
.subtitle           /* Secondary text */
.text-muted         /* Muted gray text */
.text-accent        /* Orange accent text */
.text-success       /* Green success text */
.text-danger        /* Red danger text */
.text-small         /* Small text */
.text-tiny          /* Extra small text */
```

### 🏷️ Badge/Tag Components
```css
.badge              /* Base badge */
.badge-default      /* Gray badge */
.badge-primary      /* Orange badge */
.badge-success      /* Green badge */
.badge-danger       /* Red badge */
.difficulty-badge   /* Recipe difficulty overlay */
```

### 🖼️ Modal Components
```css
.modal-overlay      /* Full screen overlay */
.modal-content      /* Modal container */
.modal-header       /* Modal header */
.modal-title        /* Modal title */
.modal-close        /* Close button */
.modal-body         /* Modal content area */
```

### ⏳ Loading/State Components
```css
.loading-container  /* Loading spinner container */
.loading-spinner    /* Orange spinning icon */
.empty-state        /* Empty state container */
.empty-icon         /* Empty state icon */
.empty-title        /* Empty state title */
.empty-description  /* Empty state description */
```

### 🛠️ Utility Components
```css
.overlay-badge      /* Recipe card overlay badges */
.recipe-stats       /* Recipe statistics row */
.recipe-stat        /* Individual recipe stat */
.recipe-tags        /* Recipe tags container */
.recipe-nutrition   /* Recipe nutrition info */
.nutrition-highlight /* Highlighted nutrition values */
.line-clamp-2       /* Truncate text to 2 lines */
.divider            /* Text divider (•) */
.icon-star-filled   /* Filled star icon */
.heart-filled       /* Filled heart icon */
```

## Usage Examples

### ❌ Before (Long className strings)
```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer">
  <h3 className="font-semibold text-lg mb-2 overflow-hidden display-webkit-box webkit-line-clamp-2 webkit-box-orient-vertical">
    Recipe Title
  </h3>
  <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors">
    Add to Favorites
  </button>
</div>
```

### ✅ After (Clean semantic classes)
```tsx
<div className="card-hover">
  <h3 className="title mb-2 line-clamp-2">
    Recipe Title
  </h3>
  <button className="btn-primary">
    Add to Favorites
  </button>
</div>
```

## Benefits

1. **🧹 Cleaner Components**: No more long className strings
2. **♻️ Reusability**: Common patterns defined once, used everywhere
3. **🎨 Consistency**: Unified design system across the app
4. **📚 Discoverability**: Easy to find and understand class purposes
5. **🛠️ Maintainability**: Changes in one place affect the whole app
6. **📖 Readability**: Code is self-documenting with semantic names

## Guidelines

### ✅ DO
- Use semantic class names that describe purpose
- Combine utility classes for specific needs
- Keep component-specific styles minimal
- Document new classes you add

### ❌ DON'T
- Create overly specific classes
- Duplicate existing functionality
- Use appearance-based names
- Add styles directly to components for common patterns

## File Structure
```
src/
├── index.css          # 🎨 Centralized CSS system
├── components/        # 🧩 Components using semantic classes
│   ├── RecipeCard.tsx # Uses: card-hover, title, btn-primary
│   ├── Navigation.tsx # Uses: nav-*, space-items, text-accent
│   └── Home.tsx       # Uses: page-container, grid-responsive
└── pages/            # 📄 Pages using the system
    └── Login.tsx     # Uses: flex-center, card, form-*, btn-primary
```

## Adding New Classes

When adding new classes to `src/index.css`:

1. **Choose the right category**
2. **Use semantic naming**
3. **Follow existing patterns**
4. **Update this documentation**

Example:
```css
/* =================================
   YOUR NEW CATEGORY
   ================================= */

.your-component {
  @apply base-tailwind-classes;
}
```

## Responsive Design

All classes are designed with mobile-first responsive principles:
- Use responsive grid classes: `grid-responsive`
- Navigation adapts: `nav-menu` (desktop) + `nav-mobile`
- Cards stack properly on mobile

---

**Happy Styling! 🎨**

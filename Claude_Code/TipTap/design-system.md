# TipTap Design System

## Design Principles
- **Speed First**: Maximum 3 taps to complete any transaction
- **One-Handed Operation**: All primary actions within thumb reach
- **Visual Clarity**: High contrast, large touch targets
- **Accessibility**: WCAG 2.1 AA compliance

## Color Palette
```css
/* Primary Colors */
--primary-green: #00C853;     /* Success, Send actions */
--primary-blue: #2196F3;      /* Receive actions, Info */
--primary-purple: #9C27B0;    /* NFC, Special features */

/* Neutral Colors */
--neutral-900: #1A1A1A;       /* Primary text */
--neutral-700: #4A4A4A;       /* Secondary text */
--neutral-500: #757575;       /* Disabled text */
--neutral-300: #E0E0E0;       /* Borders */
--neutral-100: #F5F5F5;       /* Background */
--white: #FFFFFF;

/* Semantic Colors */
--success: #4CAF50;
--warning: #FF9800;
--error: #F44336;
--info: #2196F3;

/* Category Colors */
--golf: #4CAF50;
--hotel: #9C27B0;
--valet: #FF5722;
--restaurant: #FF9800;
```

## Typography
```css
/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Font Sizes */
--text-xs: 12px;      /* Labels, captions */
--text-sm: 14px;      /* Body text, descriptions */
--text-base: 16px;    /* Default body */
--text-lg: 18px;      /* Large body */
--text-xl: 20px;      /* Small headings */
--text-2xl: 24px;     /* Medium headings */
--text-3xl: 32px;     /* Large headings */
--text-4xl: 48px;     /* Display text */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing Scale
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

## Component Library

### Button Styles
```css
/* Primary Button */
.btn-primary {
  height: 56px;
  padding: 0 24px;
  border-radius: 28px;
  font-size: 16px;
  font-weight: 600;
  min-width: 120px;
}

/* Large Action Button */
.btn-large {
  height: 72px;
  padding: 0 32px;
  border-radius: 36px;
  font-size: 18px;
  font-weight: 600;
  min-width: 200px;
}

/* Icon Button */
.btn-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Amount Button */
.btn-amount {
  height: 64px;
  width: 100%;
  border-radius: 16px;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Layout Constraints
- **Thumb Zone**: Primary actions within 75% of screen height from bottom
- **Minimum Touch Target**: 44px × 44px
- **Safe Areas**: 16px minimum margin from screen edges
- **Content Width**: Maximum 375px for readability

### Animation & Feedback
- **Micro-interactions**: 200ms ease-out transitions
- **Haptic Feedback**: Light impact for buttons, medium for success
- **Visual Feedback**: 0.95 scale on touch, color change on state
- **Loading States**: Skeleton screens, progress indicators

## Accessibility Guidelines
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Focus States**: 2px outline with high contrast color
- **Screen Reader**: Semantic HTML, ARIA labels
- **Text Size**: Scalable with system preferences
- **Voice Over**: Descriptive labels for all interactive elements
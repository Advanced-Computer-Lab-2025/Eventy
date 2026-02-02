# Design Guidelines: University Event Management System

## Design Approach

**Reference-Based**: Inspired by Luma's modern event aesthetics + Notion's clean information architecture + Partiful's youthful energy. This creates an experience that feels both vibrant and trustworthy for university environments.

**Core Principles**:

- Energy & Movement: Dynamic, vibrant design that captures student enthusiasm
- Discovery-First: Events showcased beautifully to drive engagement
- Effortless Registration: Minimal friction from discovery to attendance
- Admin Power: Robust management tools with intuitive interfaces

---

## Color Palette

**Light Mode**:

- Primary: 262 70% 55% (Vibrant university purple)
- Primary Hover: 262 70% 48%
- Secondary: 180 65% 50% (Energetic teal accent)
- Background: 0 0% 100%
- Surface: 260 30% 98%
- Border: 260 15% 88%
- Text Primary: 260 30% 12%
- Text Secondary: 260 15% 40%

**Dark Mode**:

- Primary: 262 65% 60%
- Primary Hover: 262 65% 65%
- Secondary: 180 60% 55%
- Background: 260 25% 8%
- Surface: 260 20% 12%
- Border: 260 15% 22%
- Text Primary: 260 15% 95%
- Text Secondary: 260 10% 70%

**Category Colors** (for event types):

- Academic: 210 70% 55% (Blue)
- Social: 340 75% 58% (Pink)
- Sports: 25 85% 55% (Orange)
- Cultural: 280 60% 58% (Purple)
- Career: 142 60% 48% (Green)

---

## Typography

**Font Families**:

- Primary: 'Plus Jakarta Sans' (Google Fonts) - Modern, geometric, youthful
- Display: 'Plus Jakarta Sans Bold' - Strong headlines
- Mono: 'JetBrains Mono' (for date/time displays)

**Scale**:

- Hero: text-5xl md:text-7xl font-bold (landing, event hero)
- H1: text-4xl md:text-5xl font-bold
- H2: text-3xl md:text-4xl font-bold
- H3: text-2xl md:text-3xl font-semibold
- H4: text-xl font-semibold
- Body: text-base
- Caption: text-sm
- Micro: text-xs font-medium

---

## Layout System

**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12, 16, 24

- Component padding: p-4 to p-6
- Card spacing: gap-6 to gap-8
- Section spacing: py-16 md:py-24
- Containers: max-w-7xl mx-auto px-4 md:px-6

**Grid Patterns**:

- Event Grid: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6
- Featured Events: 2-column masonry layout on desktop
- Calendar: Full-width with sidebar filters
- Admin Dashboard: 12-column grid system

---

## Component Library

### Navigation

**Top Navigation**: Sticky header with glassmorphic background (backdrop-blur-xl bg-white/80 dark:bg-surface/80), logo left, search center, user/notifications right. Category pills below main nav on desktop.

**Mobile Navigation**: Bottom tab bar with 5 actions (Discover, Calendar, My Events, Create, Profile) using vibrant gradient active states.

### Event Discovery

**Event Cards**: Elevated cards (shadow-lg) with:

- Full-width cover image (aspect-[16/9])
- Category badge (top-left, small pill with category color)
- Date/time (prominent, using mono font)
- Title (text-xl font-bold, 2-line clamp)
- Location + attendee count with icons
- Quick action buttons (Save, Share, Register)
- Hover: Lift effect (transform scale-[1.02]) + stronger shadow

**Featured Event Hero**: Full-bleed image with gradient overlay, large title, key details, primary CTA. Height: h-[400px] md:h-[500px].

**Event List View**: Compact horizontal cards with thumbnail left, details right, expandable on click.

### Calendar Views

**Month View**: Grid with event indicators (colored dots by category), click date to see day details in side panel.

**Week/Day View**: Timeline with event blocks, drag-to-create functionality for admins, color-coded by category.

**Filters Panel**: Sticky sidebar with category toggles, date range picker, location filters, search bar.

### Registration Flow

**Step Indicator**: Progress bar at top showing steps (1. Event Details → 2. Ticket Selection → 3. Information → 4. Confirmation).

**Ticket Selection**: Card-based options with pricing, quantity selectors, feature comparison for different tiers.

**Form Fields**: Large touch targets, inline validation, autofill support, clear error states with helpful messages.

**Confirmation Screen**: Success animation, QR code ticket, add to calendar buttons, social share options.

### Admin Dashboard

**Analytics Cards**: Stats with sparkline charts, trend indicators (↑↓), comparison periods.

**Event Management Table**: Sortable columns, bulk actions, quick edit inline, status indicators (Live, Draft, Past).

**Creation Wizard**: Multi-step with live preview, media upload with drag-drop, rich text editor for descriptions, duplicate event feature.

### Data Visualization

**Attendance Charts**: Bar charts for capacity, line graphs for registration trends, pie charts for demographic breakdowns.

**Heatmaps**: Popular event times, peak registration periods, location density.

---

## Images

**Hero Sections**:

- Landing Page: Dynamic collage of university events (concerts, sports, lectures) with vibrant color overlay gradient (purple to teal). Height: h-[500px] md:h-[600px].
- Event Detail Pages: High-quality event-specific imagery, full-width with text overlay at bottom third.

**Event Cards**: Required cover image (16:9 ratio), fallback to gradient with category icon if missing.

**Profile/About**: Candid photos of students at events, campus scenes, celebration moments. Mix of full-width and grid layouts.

**Empty States**: Playful illustrations in brand colors (student discovering events, calendar with confetti).

---

## Interactive States

**Buttons**:

- Primary: Vibrant gradient (from-primary to-secondary), white text, rounded-full, px-8 py-3
- Secondary: Outline with primary color, transparent bg, hover fills with primary
- Ghost: Transparent, hover shows subtle bg
- On images: backdrop-blur-md bg-white/20 border border-white/30

**Cards**:

- Hover: Subtle lift (translateY(-4px)), enhanced shadow, scale image slightly
- Active: Pressed state (scale-[0.98])

**Focus States**:

- Ring with primary color (ring-2 ring-primary ring-offset-2)
- High contrast for accessibility

---

## Responsive Behavior

**Breakpoints**: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px

**Key Adaptations**:

- Event Grid: 3 cols → 2 cols → 1 col
- Navigation: Top bar → Bottom tabs
- Calendar: Sidebar filters → Bottom sheet on mobile
- Event Hero: Reduce height and text size proportionally
- Admin Tables: Horizontal scroll with sticky first column on mobile

---

## Animation & Motion

**Strategic Use**:

- Page Transitions: Smooth fade (duration-300)
- Event Card Hover: Transform + shadow (duration-200)
- Registration Progress: Step slide-in from right (duration-400)
- Success States: Confetti or checkmark animation (celebrate.js)
- Skeleton Loading: Shimmer effect for event cards

**Avoid**: Excessive scroll animations, parallax (except hero), distracting micro-interactions

---

## Accessibility

- WCAG AA contrast ratios maintained
- Keyboard navigation for calendar and forms
- Screen reader labels on all interactive elements
- Reduced motion support (@media prefers-reduced-motion)
- Minimum 44px touch targets
- Clear focus indicators with primary color ring
- Consistent dark mode across all form inputs and overlays

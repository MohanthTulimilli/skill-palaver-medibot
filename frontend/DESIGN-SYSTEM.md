# MediBots Design System

Premium AI healthcare SaaS UI with dark/light theme support.

## Theme Palette

| Token | Hex | Use |
|-------|-----|-----|
| Primary | #0A84FF | Medical blue, CTAs |
| Secondary | #00C2A8 | Teal accent |
| Background Light | #F4F9FF | Soft layered |
| Background Dark | #0F172A | Deep navy |
| Success | Calm green | Approved, positive |
| Error | Soft red | Denied, errors |

## Design Tokens (CSS)

- `--shadow-soft` – Soft card shadow
- `--shadow-card` – Elevated card shadow
- `--shadow-glow` – AI/primary glow

## Components

- **StatCard** – Premium stat card with gradient top border, icon in gradient circle, micro-animations
- **ChartCard** – Chart container with optional filter, AI glow variant
- **PageHeader** – Page title + description, optional gradient variant
- **EmptyState** – Friendly empty state with icon, message, optional CTA
- **GradientButton** – Primary/outline/ghost variants

## Layout

- **Sidebar** – `sidebar-glass` glassmorphism, active glow indicator, icon hover scale
- **Navbar** – `navbar-glass` blur, floating search, rounded controls

## Utilities

- `.kpi-card` – Premium card with gradient top border, hover lift + glow
- `.kpi-card-ai` – AI section with subtle glow on hover
- `.sidebar-item-active` – Glowing left border
- `.gradient-primary` – Blue-to-teal gradient

## Animations (Tailwind)

- `animate-fade-in` – Fade + slide up
- `animate-float` – Subtle float (6s)
- `animate-pulse-medical` – Medical pulse (2s)
- `animate-shimmer` – Shimmer effect for skeletons

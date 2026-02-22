# Medibots Health – Frontend

React + Vite + TypeScript frontend. Connects to the Supabase backend via env vars.

## Prerequisites

- Node.js 18+ and npm

## Setup

```bash
# Install dependencies (use --ignore-scripts if you see ERR_INVALID_ARG_TYPE on Windows)
npm install --ignore-scripts

# Copy env and set your Supabase URL and anon key
copy .env.example .env
# Edit .env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
```

## Run

```bash
npm run dev
```

Open **http://localhost:8080**.

## Build

```bash
npm run build
```

Output in `dist/`. Use `npm run preview` to serve the build locally.

## Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui (Radix)
- React Router, TanStack Query, React Hook Form + Zod
- Supabase client (auth + API)

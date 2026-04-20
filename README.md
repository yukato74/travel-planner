# Travel Planner

Travel Planner is a Next.js App Router app backed by Supabase.
It uses Supabase Auth (Email Magic Link) with SSR session handling via `@supabase/ssr`.

## UI Structure

- `/`:
  - If logged in: immediately redirects to `/dashboard`
  - If logged out: shows only a centered `Login` button
- Header:
  - Hamburger menu + Drawer navigation
  - Trip switching from Drawer list
  - `Info` button in Drawer (owner-only behavior)
  - `Logout` button in Drawer
- `/trip/[id]`:
  - Keeps tab layout: `Itinerary`, `Flights & Hotels`, `Notes`
  - Top management details are hidden from page body
  - Share URL/password are not shown on trip body
  - Share URL/password can be viewed only by owner inside Info dialog

## Auth Behavior

- Login method: Email Magic Link (`signInWithOtp`)
- `/dashboard` requires login (middleware redirect to `/login`)
- `/trip/[id]` can be viewed without login
- Editing on `/trip/[id]` is owner-only

## Core Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- MUI
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- dnd-kit (places drag-and-drop)

## Supabase Clients (SSR Setup)

- Browser client: `src/lib/supabase/browser-client.ts`
- Server client: `src/lib/supabase/server-client.ts`
- Middleware client: `src/lib/supabase/middleware-client.ts`
- Middleware: `middleware.ts`
- Auth callback: `src/app/auth/callback/route.ts`

## Data Model Notes

`trips` includes `owner_user_id`.

- New trips save `owner_user_id = current user.id`
- Dashboard lists only trips where `owner_user_id` matches the current user

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Set Auth URLs in Supabase:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
4. Create `.env.local`:

```bash
cp .env.example .env.local
```

`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Local Run

```bash
npm install
npm run dev
```

## Routes

- `/` Home
- `/login` Magic Link login
- `/dashboard` My trips (login required)
- `/trip/[id]` Trip details (viewable without login, editable by owner)

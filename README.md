# Clinic Next.js App

## Setup
1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase URL and anon key
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run locally:
   ```bash
   npm run dev
   ```

## Routes
- `/` = patient booking site
- `/admin` = admin panel

## Notes
- The booking form writes to `patients` and `appointments`
- Admin panel uses Supabase Auth and realtime updates
- If you want to use real images, add `public/hero.jpg` and `public/about.jpg`

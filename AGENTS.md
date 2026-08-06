# Project notes

## Hosting

This site now uses server features (API routes, a database, Stripe payments)
for the rental booking calendars on `/rentals`, so it can **no longer be
statically exported to GitHub Pages**. The `.github/workflows/deploy*.yml`
workflows have been moved to `.github/workflows-disabled/` and disabled.

Deploy this project on **Vercel** instead:

1. Import the GitHub repo at https://vercel.com/new.
2. Vercel auto-detects Next.js — no build config changes needed.
3. Add the environment variables below in the Vercel project settings
   (Settings > Environment Variables), for both Production and Preview.
4. Push to `main` and Vercel will deploy automatically on every push.

## Booking system setup

The booking calendars on `/rentals` (Main House and Vineyard Tiny Home) are
fully functional: each shows live availability and lets guests pay online via
Stripe Checkout. Two things need to be provisioned before it works:

### 1. Database (Postgres — Supabase or Neon)

The app connects with the standard `postgres` npm driver, so any Postgres
provider works. No manual schema setup is needed either way — the `bookings`
table is created automatically the first time the app queries it.

**Option A — Supabase:**
1. Create a project at https://supabase.com.
2. Go to Project Settings > Database > Connection string, and copy the
   **Transaction pooler** connection string (port 6543) — this is the one
   suited to serverless functions, which open lots of short-lived connections.
3. Set it as `DATABASE_URL` in Vercel.

**Option B — Neon:**
1. In the Vercel project, go to Storage > Create Database > Neon (Postgres).
2. This automatically adds a `DATABASE_URL` environment variable to the
   project.

### 2. Payments (Stripe)

1. Create a Stripe account at https://dashboard.stripe.com if you don't have
   one, and start in **test mode**.
2. Copy the secret key from Developers > API keys and set it as
   `STRIPE_SECRET_KEY` in Vercel.
3. Once the site is deployed, go to Developers > Webhooks in Stripe and add
   an endpoint: `https://<your-domain>/api/webhooks/stripe`, listening for
   the `checkout.session.completed` event.
4. Copy the webhook's signing secret and set it as `STRIPE_WEBHOOK_SECRET`
   in Vercel.
5. Test a booking end-to-end using Stripe's test card `4242 4242 4242 4242`
   with any future expiry/CVC.
6. When ready to accept real payments, switch the Stripe dashboard out of
   test mode and replace `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` with
   the live-mode equivalents (and create a second webhook endpoint in live
   mode).

See `.env.example` for the full list of required environment variables. For
local development, copy it to `.env.local` and fill in the values.

### 3. Admin pricing token (for /admin/prices)

1. Generate a long random string (e.g. `openssl rand -hex 32` or any secure
   generator).
2. Add it as `ADMIN_TOKEN` in Vercel's environment variables.
3. Redeploy.
4. Visit `https://<your-domain>/admin/prices`, enter the token, and use the
   form to set custom nightly rates for any date range.
5. Visit `https://<your-domain>/admin/blocks` to mark date ranges as
   unavailable for either property. Blocked dates are treated as booked and
   cannot be selected by guests.
6. Visit `https://<your-domain>/admin/bookings` to view all bookings in a
   calendar, including date range, client name, daily rate, total price, and
   special requests.

### How booking availability works

- Each property (`main-house`, `vineyard-tiny-home`) is configured in
  `src/lib/properties.ts`, including nightly price and minimum stay. **The
  nightly prices there are placeholders — update them with real rates.**
- `GET /api/availability` returns already-booked date ranges for a property.
- `POST /api/checkout` validates the selected dates aren't already booked,
  creates a `pending` booking row, and starts a Stripe Checkout session.
- Pending bookings hold the dates for 30 minutes (in case a guest starts
  checkout but doesn't finish) so two guests can't pay for the same nights.
- The Stripe webhook marks a booking `confirmed` once payment succeeds,
  which then blocks those dates permanently.

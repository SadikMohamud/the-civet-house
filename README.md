# The Civet House

A stamp-based loyalty card PWA for The Civet House coffee shop. Buy X, get Y free. Customers carry a digital stamp card on their phone, staff scan a QR to add stamps, and the owner sets the rule and watches the numbers.

Built with Next.js (App Router), Supabase (Postgres, Auth, RLS) and Vercel.

## How it works

- **Customers** create an account with an email and password, confirm their address by email, then see their stamp progress and show a unique QR code at the till. When the card completes, a reward banner appears.
- **Staff** scan the customer QR (or look them up by email or name), add one stamp per visit, and redeem completed cards.
- **The owner** sets the rule (stamps required plus reward), manages staff, and sees customer counts.

### Integrity model

- `stamp_events` is append-only: one row per stamp earned or reward redeemed, never a mutable counter. Update and delete are revoked at the database level.
- All writes go through two Postgres functions, `add_stamp` and `redeem_reward`, which verify the caller is staff or owner. Customers cannot grant themselves stamps, even with direct API access.
- Every customer gets a unique, opaque `card_code` shown as their QR. It never exposes the auth user ID and is only useful to a staff-authenticated device.
- Row-level security means a customer can only ever read their own card.
- Card progress is always derived from the event log, never stored.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push` with the CLI).
3. Run `supabase/seed.sql` to create the default rule (9 stamps, free coffee).

### 2. Email auth

Sign up is by email and password with an email confirmation step. In the Supabase dashboard:

1. Authentication, then Sign In / Up, then Email: make sure the email provider is enabled and "Confirm email" is turned on.
2. Authentication, then Emails, then Templates: open the "Confirm signup" template and set the confirmation link to the token hash flow so it works with this app's server auth:

   ```
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
   ```

Supabase's built-in email sender is fine for testing. For production volume, connect your own SMTP provider under Authentication, then Emails, then SMTP Settings.

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings, API. Secrets live only in env vars, never in the code.

### 4. Run

```bash
npm install
npm run dev
```

### 5. Owner bootstrap

Create an account in the app once with the owner's email and confirm it, then run one line in the Supabase SQL editor (see `supabase/seed.sql`):

```sql
update public.profiles set role = 'owner' where email = 'owner@example.com';
```

After that, the owner adds staff from the dashboard. Staff create their own account on the shop device.

## Deploy (Vercel)

1. Push this repo to GitHub and import it into Vercel.
2. Add the two environment variables from `.env.example`.
3. In Supabase, under Authentication then URL Configuration, set the Site URL to the Vercel URL and add `https://your-domain/auth/callback` to the redirect list.

## Branding

All brand values live in one file: `lib/theme.ts` (name, tagline, colours, logo path). The current colours and the icon in `public/icons/icon.svg` are placeholders. To apply the real brand:

1. Edit the colours in `lib/theme.ts`.
2. Replace `public/icons/icon.svg` with the real logo.
3. Ideally add real 192px and 512px PNG icons and update `app/manifest.ts` for the best install experience on Android.

## Project structure

```
app/            Pages: login, card (customer), staff, owner, auth callback
components/     Shared UI: stamp grid, QR scanner, footer
lib/theme.ts    Brand config (single source of truth)
lib/supabase/   Browser and server Supabase clients
lib/v2/         Stubs for v2: Wallet passes, analytics, multi-location
supabase/       SQL migration and seed
proxy.ts        Session refresh and signed-out redirects
```

## v2 (scaffolded, not implemented)

- Apple and Google Wallet passes (`lib/v2/wallet.ts`)
- Analytics over the event log (`lib/v2/analytics.ts`)
- Multi-location (`lib/v2/locations.ts`, plus nullable `location_id` columns already in the schema)

---

Built by [Snurm](https://github.com/SadikMohamud)

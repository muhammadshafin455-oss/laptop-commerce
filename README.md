# VoltSupply

A laptop-charger storefront built with Next.js 16 (App Router), Prisma 7 and
PostgreSQL. Customers browse the catalogue, build a cart, and check out for
either delivery or self pickup; the shop reviews and progresses every order from
an admin dashboard.

## Stack

| Piece      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 16.3 (App Router, Server Actions)           |
| Database   | PostgreSQL via Prisma 7 + `@prisma/adapter-pg`      |
| Styling    | Tailwind CSS v4 (theme tokens in `globals.css`)     |
| Icons      | `lucide-react`                                      |
| Images     | Uploaded from disk, stored as `Bytes` in Postgres, served from `/api/charger-image/[id]` |
| Type       | Inter via `next/font/google`                        |
| Cart state | `localStorage`, read through `useSyncExternalStore` |
| Auth       | Phone + password for customers, password for staff; HMAC-signed `httpOnly` cookies |

## Getting started

```bash
npm install
cp .env.example .env       # fill in DATABASE_URL and ADMIN_PASSWORD
npm run db:push            # create the tables
npm run db:seed            # sets the default delivery fee
npm run dev
```

Open <http://localhost:3000> for the storefront and
<http://localhost:3000/admin> for the dashboard.

### Data commands

| Command | What it does |
| ------- | ------------- |
| `npm run db:push` | Sync the schema to the database. |
| `npm run db:seed` | Ensure the store settings row exists. |
| `npm run db:seed -- --demo` | Also insert six demo chargers. **Off by default** so it can never drop mock rows into a live catalogue. |
| `npm run db:reset` | Dry run: list the chargers, orders and accounts that would be deleted. |
| `npm run db:reset -- --yes` | Actually delete them. Store settings are kept. |

### Environment

| Variable         | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string.                                            |
| `ADMIN_PASSWORD` | Unlocks `/admin`. Admin sessions are derived from it, so changing it signs staff out. If unset, the dashboard stays locked. |
| `AUTH_SECRET`    | Signs customer session cookies. Changing it signs every customer out.    |

Prisma 7 no longer loads `.env` on its own, so `prisma.config.ts` calls
`process.loadEnvFile()` for the CLI. Next.js still loads `.env` itself at
runtime.

## Routes

**Storefront**

| Route          | What it does                                                    |
| -------------- | --------------------------------------------------------------- |
| `/`            | Landing page, with the full catalogue two-up below the hero.      |
| `/chargers`    | Catalogue of listed chargers with live stock and discounts.       |
| `/cart`        | Cart, fulfilment choice, customer details, checkout.              |
| `/orders`      | Order history with a roll-up, or search by name, phone, email, or order ID. |
| `/orders/[id]` | Order confirmation and status timeline.                           |
| `/signup`      | Create a customer account with a phone number and password.       |
| `/login`       | Sign in.                                                          |

**Admin** (password-gated)

| Route              | What it does                                                |
| ------------------ | ------------------------------------------------------------ |
| `/admin`           | One screen per pipeline stage, with counts and stage-appropriate transitions. |
| `/admin/chargers`  | Two tabs — existing chargers (with piece counts) and add a charger. |
| `/admin/settings`  | Delivery fee charged on delivery orders.                      |
| `/admin/login`     | Sign in.                                                      |

## How it fits together

- **`src/lib/queries.ts`** is the only place that reads the database for pages.
  It flattens Prisma `Decimal` columns to plain numbers so results can cross the
  server/client boundary.
- **`src/app/actions/orders.ts`** holds `placeOrder`. The client sends only
  *what* and *how many*; prices, discounts and the delivery fee are re-read from
  the database, and stock is decremented under a `stock >= quantity` guard
  inside a transaction so concurrent checkouts cannot oversell.
- **`src/app/admin/actions.ts`** holds the admin mutations. Server Functions are
  reachable by direct POST, so each one re-checks authorisation with
  `requireAdmin()` rather than trusting the page guard.
- **`src/lib/auth.ts`** issues an HMAC-signed, `httpOnly` session cookie derived
  from `ADMIN_PASSWORD`, with a 12-hour lifetime.
- **`src/lib/cart-store.tsx`** exposes the `localStorage` cart through
  `useSyncExternalStore`, which keeps the server and hydration renders in
  agreement and syncs across open tabs.
- **`src/lib/user-auth.ts`** handles customer accounts: `scrypt` password
  hashing (salt and hash stored together, no extra dependency) and a 30-day
  signed session cookie. Checkout stays open to guests; signing in only
  prefills the form and attaches the order to the account.

### Product photos

Photos are uploaded from the admin's machine — there is no image-URL field.
Each one is stored in its own `ChargerImage` row and served by
`/api/charger-image/[id]`, which sets a one-year immutable cache header; callers
append `?v=<updatedAt>` so a re-upload busts it. Catalogue queries select only
the image's timestamp, never its bytes, so listing products stays cheap.

Uploads are capped at 5MB and limited to JPEG, PNG, WebP, GIF and AVIF
(`src/lib/images.ts`). Server Actions cap request bodies at 1MB by default, so
`next.config.ts` raises `serverActions.bodySizeLimit` to 6mb — keep the two in
step if you change the limit.

### Finding orders

`findOrders` matches an order ID exactly, and the customer's name, email and
phone number partially, so "shafin" or "0331" find something rather than
nothing. Phone queries are reduced to digits first, to match how numbers are
stored, and are only used when at least three digits were typed — otherwise a
name search would match every row.

A signed-in customer's history also includes orders they placed as a guest with
the same phone number, so checking out before signing in does not hide them.

### Cart badge

The header badge counts **distinct products**, not units: raising the quantity
of something already in the cart does not move it. `useCart` exposes both —
`lineCount` for the badge and `itemCount` for totals.

### Currency

Amounts are formatted as PKR (`Rs`) by `formatMoney` in `src/lib/money.ts`.
`Intl` gives PKR zero decimal places by default, which would round a Rs 7.50
delivery fee to Rs 8 and stop line items adding up to the order total — so two
decimals are forced, matching the `Decimal(10, 2)` columns the values are stored
in. To change currency, that formatter is the only place to edit.

### Phone numbers

Phone numbers are the customer login identifier, so they are stored reduced to
digits only. A leading `+` is deliberately discarded — treating it as
significant would let `+1 555 010 9999` and `15550109999` register as two
separate accounts, and would stop someone signing in with the same number typed
a different way. Numbers still have to be entered in a consistent
national/international shape: `03001234567` and `+923001234567` remain distinct,
which would need a country code to resolve.

### Destructive actions

Deleting a charger requires an explicit `confirm` field that only the two-step
confirm button sends. Because Server Functions are reachable by direct POST,
that check lives in the action rather than in the UI, so a stray or replayed
submission cannot remove a listing.

### Order lifecycle

The pipeline is a state machine in `src/lib/order-flow.ts`. The admin control
only ever offers the moves that are valid from the order's current stage — not
the full list of statuses.

| Stage | What the shop does | Offered next |
| ----- | ------------------ | ------------ |
| `PENDING` | Call the customer to confirm | `CONFIRMED`, `REJECTED` |
| `CONFIRMED` | Order accepted | `PREPARING` (start packing), `CANCELLED` |
| `PREPARING` | Packing | `OUT_FOR_DELIVERY` *or* `READY` — whichever matches the customer's choice — plus `CANCELLED` |
| `READY` / `OUT_FOR_DELIVERY` | Waiting on handover | `COMPLETED`, `CANCELLED` |
| `COMPLETED` / `REJECTED` / `CANCELLED` | Finished | nothing — these are final |

`READY` and `OUT_FOR_DELIVERY` are mutually exclusive: a delivery order is never
offered "ready for pickup", and a pickup order is never offered "out for
delivery".

Rejecting requires a note; cancelling accepts an optional one. Either shows on
the customer's order page, returns the reserved stock to the catalogue, and
files the order under the **Rejected / cancelled** screen.

The same rules are enforced inside `updateOrderStatus`, not just in the
dropdown, because Server Functions are reachable by direct POST. Because no
transition leads back out of a finished order, restocking only ever runs once.

> Final statuses are deliberately one-way. If you want an undo for a mis-click,
> add the reverse transition to `nextStatuses` — the restock logic in
> `updateOrderStatus` would then need its matching decrement restored.

## Notes

- `npm audit` reports a high-severity advisory in `deepmerge-ts`, reached through
  the Prisma **CLI** (`@prisma/config`). It is a build-time dependency, not
  runtime, and the only offered fix downgrades Prisma to v6.
- `DATABASE_URL` should use `sslmode=verify-full`. `pg` currently treats
  `require` as `verify-full` but warns on every connection that this will change
  in `pg` v9, where `require` becomes the weaker libpq semantics. Naming
  `verify-full` pins today's behaviour and silences the warning.

# My Seasonal Basket

The online store for the farm: seasonal baskets and farm products, in English
and Arabic, with delivery areas and time slots. Built with Next.js and hosted on
Netlify.

The store has no database of its own. It reads the published catalog from the
farm's Farm Agent database and places web orders there through the `shop_*`
functions (Farm Agent migration `202610210001_online_shop`, see its
`docs/online-shop.md`). Prices, stock and every order rule are checked in the
database, never trusted from the browser. Farm staff confirm web orders in
Farm Agent.

## What a shopper can do

- Browse baskets and products with live stock (`/en`, `/ar`, right-to-left in Arabic)
- Add to a cart kept in their browser
- Check out: name, mobile, area, address, a delivery day and window, and
  payment by cash on delivery, Wish Money, OMT or WhatsApp
- See a confirmation page with the order reference, payment instructions and a
  WhatsApp link with the order filled in

Not in this first version: shopper accounts, recurring basket subscriptions and
card payments (the database already has the tables; the screens come next).

## Running locally

Needs Farm Agent's local database with the online-shop migration applied
(`pnpm local:start && pnpm local:setup` in Farm Agent, which also creates the
`shop_runtime` login).

```sh
pnpm install --frozen-lockfile
cp .env.example .env.development.local    # then fill in the values
SEED_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres pnpm local:seed   # sample data; prints SHOP_FARM_ID
pnpm dev                                   # http://localhost:3000
```

`pnpm local:seed` refuses to run against anything but this computer.

## Checks (before every push)

```sh
pnpm test && pnpm typecheck && pnpm lint && pnpm build
```

## Releasing

Same flow as Farm Agent: a `feature/<description>` branch, a pull request to
`main`, a Netlify Deploy Preview pointed at a **test** database, and a merge only
with the owner's approval. Builds never change the database.

# AZ BAKERS

A warm, responsive bakery storefront built with Next.js, TypeScript and React.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Storefront

- Home, shop, product details, a guided cake builder, cart and checkout request.
- Search, category and occasion filters, sorting, and price limits.
- The **Menu & prices** page lists every current product, its price, and serving/pack size.
- Google Sheets menu data updates storefront prices, categories, product cards and details.
- Failed product image URLs fall back to a local AZ BAKERS cake illustration.
- Motion is subtle and respects the user's reduced-motion setting.

## Admin and Google Sheets

The admin desk at `/admin` supports create, read, update and delete for product name, category, price, description, image URL, tags, serving size, ingredients, allergens, lead time, featured status and stock. Without a connected Sheet, changes are saved in that browser only. For shared menu data, connect one Google Sheet through the included Apps Script.

1. Create a Google Sheet. Copy its ID from the spreadsheet URL (the text between `/d/` and `/edit`).
2. In **Extensions → Apps Script**, paste `google-apps-script/Code.gs`.
3. In Apps Script **Project Settings → Script properties**, add `SHEET_ID` and `ADMIN_KEY`. Use a long, random key for `ADMIN_KEY`.
4. Deploy as a **Web app**, executing as your account, with access set to **Anyone**. The script returns the public product menu; mutations require the private key held only by the Next.js server.
5. Copy `.env.example` to `.env.local`. Set `GOOGLE_APPS_SCRIPT_URL` to the deployment's `/exec` URL, `GOOGLE_APPS_SCRIPT_ADMIN_KEY` to the matching script property, and `ADMIN_PASSWORD` to a separate private admin password. Restart Next.js after changing environment values.
6. Open `/admin`. The first deployment creates a `Products` tab with the existing sample menu and prices. The header row documents the data fields. Changes through the admin form are written to the Sheet and reflected on the storefront.

Never put `ADMIN_PASSWORD` or `GOOGLE_APPS_SCRIPT_ADMIN_KEY` in a `NEXT_PUBLIC_` variable or spreadsheet cell. Keep Apps Script access and admin credentials private. Menu reads are intentionally public for the storefront.

## Demo and launch notes

The starter menu and product images are sample content and must be reviewed against the actual bakery's products, recipes and prices. Allergen notes are not cross-contamination guarantees. Checkout currently records no order and takes no payment; the customer-facing flow is still a request demo. A real launch needs a server-side order/notification workflow and payment integration.

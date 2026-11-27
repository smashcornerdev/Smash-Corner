# Vendored libraries for the Edge Functions

Supabase's deploy bundler only accepts imports from registries it supports (npm:, jsr:, deno.land, esm.sh), not from
cdn.sheetjs.com, and the npm copy of SheetJS (`xlsx` 0.18.5) is an old release with security advisories. So the
monthly-report function uses this copy of the same SheetJS build the website installs.

- `xlsx.mjs`   = `node_modules/xlsx/xlsx.mjs` (SheetJS Community Edition 0.20.3, Apache-2.0)
- `xlsx.d.mts` = `node_modules/xlsx/types/index.d.ts`

To update: change the `xlsx` version in package.json, `npm install`, copy the two files above again, and redeploy
monthly-report.

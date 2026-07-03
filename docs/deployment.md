# Deployment Guide

This app is prepared for a Vercel production deployment with Postgres for data and Vercel Blob for uploaded images.

## Production Services

- Vercel: Next.js hosting and server actions.
- Neon or Vercel Postgres: production Postgres database.
- Vercel Blob: public recipe and kitchen cover images.
- Google AI Studio: Gemini API key.

## Required Vercel Environment Variables

Set these in the Vercel project settings:

```bash
DATABASE_URL="postgresql://..."
GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-3.5-flash"
BLOB_READ_WRITE_TOKEN="..."
```

Use the pooled Postgres connection string for `DATABASE_URL` in Vercel runtime. For one-off schema commands such as `npm run prisma:push:prod`, use the direct Postgres connection string locally by setting `DATABASE_URL` just for that command.

## First Production Upload

1. Export the local SQLite data:

```bash
npm run data:export
```

This writes `tmp/recipe-book-data.json`.

2. Upload local image files if `public/uploads` contains anything besides `.gitkeep`:

```bash
BLOB_READ_WRITE_TOKEN="..." npm run uploads:migrate
```

This writes `tmp/upload-map.json`, mapping old `/uploads/...` paths to Vercel Blob URLs. If there are no uploaded images, skip this step.

3. Create the production schema in Postgres:

```bash
DATABASE_URL="postgresql://DIRECT_POSTGRES_URL" npm run prisma:push:prod
```

4. Import the exported local data:

```bash
DATABASE_URL="postgresql://POSTGRES_URL" npm run data:import:prod -- --input tmp/recipe-book-data.json
```

If you created an upload map in step 2:

```bash
DATABASE_URL="postgresql://POSTGRES_URL" npm run data:import:prod -- --input tmp/recipe-book-data.json --image-map tmp/upload-map.json
```

5. Connect the GitHub repository to Vercel and deploy.

`vercel.json` sets the build command to `npm run vercel-build`, which generates Prisma Client from `prisma/schema.postgres.prisma` before running `next build`.

## Local Development

Local development still uses SQLite:

```bash
DATABASE_URL="file:./dev.db" npm run prisma:push
npm run dev
```

The app stores uploads in `public/uploads` locally when `BLOB_READ_WRITE_TOKEN` is empty. In production, the same upload function stores images in Vercel Blob.

Uploaded images are expected under the Blob `uploads/` prefix. `next.config.ts` allows `https://*.public.blob.vercel-storage.com/uploads/**` for optimized image rendering.

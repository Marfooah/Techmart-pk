# TechMart Pakistan — AI Customer Support Platform

Production-style AI customer support MVP for a Pakistani electronics retailer. All prices in **PKR**.

## Features

- Modern landing page with scroll animations
- Sign up → Sign in flow with logout confirmation
- Customer portal (products, orders, tracking, returns, tickets, AI chat)
- Gemini 2.5 Flash AI with RAG, tool calling, guardrails, audit log
- Admin dashboard (stats, approvals, AI audit)

## Quick Start

```bash
npm install
cp .env.example .env.local   # then edit .env.local
npm run setup                # seed DB + ingest RAG
npm run dev
```

Open **http://localhost:3000**

## API Key (safe setup)

**Never commit your API key.**

1. Copy `.env.example` → `.env.local`
2. Add your Gemini key only in `.env.local`:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
   NEXTAUTH_SECRET=any-long-random-string
   ```
3. `.env.local` is gitignored — safe to push code to GitHub
4. For deployment, set the same variables in your host's dashboard (Vercel, Railway, etc.)

The key is read **server-side only** — never exposed in the browser UI.

## Fix product prices (PKR)

If you seeded before the PKR fix:

```bash
npx tsx scripts/fix-product-prices.ts
```

Or full reseed: `npm run seed:reset` (wipes database).

## Demo Accounts

Password: `Password123!`

| Email | Role |
|-------|------|
| customer@techmart.pk | CUSTOMER |
| admin@techmart.pk | ADMIN |
| agent@techmart.pk | AGENT |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run setup` | Seed + RAG ingest |
| `npm run seed:reset` | Wipe & reseed database |
| `npx tsx scripts/fix-product-prices.ts` | Update prices to PKR |

## Tech Stack

Next.js 15 · Prisma · SQLite · Gemini 2.5 Flash · RAG · Tailwind · shadcn/ui · Framer Motion

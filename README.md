# PocketFlow

<p align="center">
  <img src="public/Main PocketFlow logo.png" alt="PocketFlow Logo" width="220" />
</p>

**Version:** 1.0.1

A local-first personal finance web application built for calm, private money tracking. Designed with native dual-currency isolation for US Dollars (USD) and Cambodian Riel (KHR), exact integer calculations, and offline IndexedDB browser storage.

---

## Key Features

- **Dual-Currency Engine**: Native, isolated balance tracking for USD and Cambodian Riel (KHR) without forced or fluctuating currency conversions.
- **Exact Integer Arithmetic**: Stored as exact minor units (USD cents as integers, KHR as whole riels) to eliminate floating-point rounding errors.
- **Local-First & Private**: 100% of your financial transactions, accounts, and budgets remain stored in your browser via Dexie IndexedDB. No remote database, no user tracking, no backend required.
- **Spending Budgets**: Set category limits per currency and receive proactive visual indicators at 80% and 100% utilization.
- **Financial Reports**: Cash flow summaries, monthly income vs. expense breakdown, and category distribution analysis.
- **Data Portability**: Full JSON database backup and restore with Zod schema validation, plus transaction export to CSV.
- **Mobbin-Inspired Design**: Gallery-white and dark mode aesthetics, stadium-pill controls, 28% squircle icon badges, and clean typographic hierarchy.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite 8 + Oxlint
- **Local Storage**: Dexie.js (IndexedDB wrapper) + `dexie-react-hooks`
- **Validation**: Zod
- **Icons**: Lucide React
- **Testing**: Vitest

---

## Getting Started

### Prerequisites

- Node.js 20+ (Node.js 22 or 24 recommended)
- npm 10+

### Installation & Local Development

```bash
# Install dependencies
npm install

# Start development server at http://localhost:5173
npm run dev

# Run test suite
npm run test

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## Vercel Deployment

PocketFlow is configured for instant deployment on [Vercel](https://vercel.com) with preconfigured SPA routing, security headers, and asset caching via [vercel.json](file:///home/user/Documents/Project/PocketFlow/vercel.json).

### Option 1: Vercel Dashboard (Git Integration)
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com](https://vercel.com) and click **Add New...** &rarr; **Project**.
3. Import your PocketFlow repository.
4. Settings are automatically detected from `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

### Option 2: Vercel CLI
```bash
# Log in and deploy a preview
npx vercel

# Deploy directly to production
npx vercel --prod
```

---

## Docker Deployment

PocketFlow includes a production-grade multi-stage Docker build using `node:22-alpine` and `nginx:alpine`.

### Quick Start with Docker Compose

```bash
# Build and start container in detached mode (accessible at http://localhost:3000)
docker compose up -d --build

# Or using npm scripts
npm run docker:up

# Check container status and health
docker compose ps

# View logs
docker compose logs -f

# Stop and remove container
docker compose down
```

### Configuration Options
- **Port**: Set `PORT=8080` in environment or a `.env` file to customize the host port (defaults to `3000`).
- **Live Development in Docker**:
  ```bash
  docker compose --profile dev up
  ```

---

## License

Private / Personal Project.

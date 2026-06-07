This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Local Development With Supabase

Use this when you want to test changes before deploying to Vercel.

Prerequisites:

- Docker is available in WSL, either through Docker Desktop WSL integration or Docker Engine installed inside WSL
- Node.js 20 or newer is available in WSL

To install Docker Engine directly inside WSL Ubuntu:

```bash
cd /home/wsw/git/time-tracker
bash scripts/install-docker-wsl.sh
```

The installer asks for your WSL `sudo` password. After it finishes, close and reopen the WSL terminal so your `docker` group membership is refreshed.

Start the app against a local Supabase stack:

```bash
cd /home/wsw/git/time-tracker
npm run dev:local
```

The script starts Supabase locally, reads the local API URL and anon key from `supabase status`, then runs `next dev` with local environment variables. Open [http://localhost:3000](http://localhost:3000).

Local useful commands:

```bash
npm run supabase:status
npm run supabase:env
npm run supabase:reset
npm run supabase:stop
```

In local dev only, the login page shows an email/password form. Use `가입` with any test email and a password of at least 6 characters, then continue onboarding. Email confirmation is disabled in `supabase/config.toml` for local development.

If migrations change, reset the local database:

```bash
npm run supabase:reset
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

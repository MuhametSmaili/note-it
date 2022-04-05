This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```
## Enable automatic code formatting
```bash
npx husky-init && npm install
```
Go to `.husky/pre-commit` file and change `npm test` to `npx lint-staged`, it will enable automatic code formatting before commit.
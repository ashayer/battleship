# Prisma + tRPC + WebSockets

> :warning: WebSockets is an experimental feature & can change without major version bump :warning:

- Try in CodeSandbox: [https://githubbox.com/trpc/trpc/tree/main/examples/next-prisma-starter-websockets](https://codesandbox.io/s/github/trpc/trpc/tree/main/examples/next-prisma-starter-websockets?file=/src/pages/index.tsx)
- Try demo http://nextjs-websockets.trpc.io/


## Features

- 🧙‍♂️ E2E type safety with [tRPC](https://trpc.io)
- ⚡ Full-stack React with Next.js
- ⚡ WebSockets / Subscription support
- ⚡ Database with Prisma
- ⚙️ VSCode extensions
- 🎨 ESLint + Prettier
- 💚 CI setup using GitHub Actions:
  - ✅ E2E testing with [Playwright](https://playwright.dev/)
  - ✅ Linting


## Setup

```bash
npx create-next-app --example https://github.com/trpc/trpc --example-path examples/next-prisma-starter-websockets trpc-prisma-starter-websockets
cd trpc-prisma-starter-websockets
yarn
yarn dev
```

## Files of note

<table>
  <thead>
    <tr>
      <th>Path</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="./prisma/schema.prisma"><code>./prisma/schema.prisma</code></a></td>
      <td>Prisma schema</td>
    </tr>
    <tr>
      <td><a href="./src/api/trpc/[trpc].tsx"><code>./src/api/trpc/[trpc].tsx</code></a></td>
      <td>tRPC response handler</td>
    </tr>
    <tr>
      <td><a href="./src/server/routers"><code>./src/server/routers</code></a></td>
      <td>Your app's different tRPC-routers</td>
    </tr>
  </tbody>
</table>

## Commands

```bash
yarn dx # runs prisma studio + next
yarn build # runs `prisma generate` + `prisma migrate` + `next build`
yarn test-dev # runs e2e tests on dev
yarn test-start # runs e2e tests on `next start` - build required before
yarn dev-nuke # resets local db
```
---

Created by [@alexdotjs](https://twitter.com/alexdotjs).

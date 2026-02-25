FROM node:22-alpine AS builder

RUN npm install -g pnpm@9

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY server/ server/

RUN pnpm install --frozen-lockfile --filter @quiz/server...

WORKDIR /app/server
RUN pnpm exec tsc


FROM node:22-alpine

WORKDIR /app

COPY server/package.json ./package.json
RUN npm install --omit=dev

COPY --from=builder /app/server/dist ./dist

RUN adduser -D -g '' kahoot_adn
USER kahoot_adn

EXPOSE 3001

CMD ["node", "dist/server/src/index.js"]

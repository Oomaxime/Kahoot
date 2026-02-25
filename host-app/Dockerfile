FROM node:22-alpine AS builder

RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-hooks/package.json packages/shared-hooks/
COPY host-app/package.json host-app/
COPY player-app/package.json player-app/
COPY server/package.json server/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY host-app/ host-app/

ARG VITE_WS_URL=ws://localhost/ws
ARG VITE_API_URL=
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app/host-app
RUN pnpm build

FROM node:22-alpine

RUN npm install -g serve \
    && adduser -D -g '' hostuser

WORKDIR /app
COPY --from=builder /app/host-app/dist ./dist
RUN chown -R hostuser:hostuser /app

USER hostuser

EXPOSE 3002

CMD ["serve", "-s", "dist", "-l", "3002"]

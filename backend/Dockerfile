FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src

# Prisma config requires a URL while generating; no database connection is made here.
ENV POSTGRES_USER=build \
    POSTGRES_PASSWORD=build \
    POSTGRES_DB=build \
    POSTGRES_HOST=localhost \
    POSTGRES_PORT=5432

RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./package.json

EXPOSE 3000

USER node
CMD ["node", "dist/server.js"]

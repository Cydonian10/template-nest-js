FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:24-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY scripts/create-super-admin.mjs scripts/seed-permissions.mjs ./scripts/

RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node
EXPOSE 3000

CMD ["node", "dist/main.js"]

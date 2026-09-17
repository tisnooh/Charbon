# Image de production Charbon — aucun compilateur requis au build
# (libSQL fournit un binaire N-API précompilé via npm).
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps
RUN npm ci --no-audit --no-fund
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/
COPY apps/site/package.json ./apps/site/
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/drizzle ./apps/api/drizzle
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/mobile/dist ./apps/mobile/dist
COPY --from=build /app/apps/site/dist ./apps/site/dist
# La base SQLite vit hors de l'image (volume) :
VOLUME ["/data"]
ENV DB_PATH=/data/charbon.db
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]

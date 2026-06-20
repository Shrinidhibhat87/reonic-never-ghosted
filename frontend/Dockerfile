# Frontend image: Next.js 14 built and served in production mode.
FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies first (cached unless the lockfile changes).
COPY package.json package-lock.json ./
RUN npm ci

# NEXT_PUBLIC_* is baked at build time and runs in the browser, so it must point
# at the host-reachable backend, not the compose-internal hostname.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]

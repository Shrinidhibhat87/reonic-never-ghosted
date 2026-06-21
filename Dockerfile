# Web app: React + Express + SQLite mock of the Reonic platform.
# Runs in Vite dev/middleware mode (the documented workflow); the server
# uses node:sqlite, which requires Node 24+.
FROM node:24-slim

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the repo. The web server imports the agent's local
# recommendation/knowledgebase modules at runtime, so agent/src and
# agent/knowledgebase must be present in this image.
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]

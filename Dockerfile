FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public

ENV NODE_ENV=production
ENV PORT=3000
ARG APP_VERSION=local
ENV APP_VERSION=${APP_VERSION}

EXPOSE 3000

CMD ["node", "src/app.js"]

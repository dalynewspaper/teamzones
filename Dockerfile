FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# ARG NEXT_PUBLIC_FIREBASE_API_KEY
# ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
# ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# ARG NEXT_PUBLIC_FIREBASE_APP_ID
# ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
# ARG LIVECHAT_CLIENT_ID
# ARG LIVECHAT_CLIENT_SECRET
# ARG NEXT_PUBLIC_AUTH_ENVIRONMENT
# ARG NEXT_PUBLIC_HOST_URL
# ARG NEXT_PUBLIC_CHAT_ANALYZER_API
# ARG SEND_GRID_API_KEY
# ARG SEND_GRID_SENDER_EMAIL
# ARG SEND_GRID_SUPPORT_EMAIL


# RUN echo -e "NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY" >> .env
# RUN echo -e "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" >> .env
# RUN echo -e "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID" >> .env
# RUN echo -e "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" >> .env
# RUN echo -e "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" >> .env
# RUN echo -e "NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID" >> .env
# RUN echo -e "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" >> .env
# RUN echo -e "NEXT_PUBLIC_LIVECHAT_CLIENT_ID=$LIVECHAT_CLIENT_ID" >> .env
# RUN echo -e "NEXT_PUBLIC_AUTH_ENVIRONMENT=$NEXT_PUBLIC_AUTH_ENVIRONMENT" >> .env
# RUN echo -e "NEXT_PUBLIC_HOST_URL=$NEXT_PUBLIC_HOST_URL" >> .env
# RUN echo -e "NEXT_PUBLIC_CHAT_ANALYZER_API=$NEXT_PUBLIC_CHAT_ANALYZER_API" >> .env
# RUN echo -e "SEND_GRID_API_KEY=$SEND_GRID_API_KEY" >> .env
# RUN echo -e "SEND_GRID_SENDER_EMAIL=$SEND_GRID_SENDER_EMAIL" >> .env
# RUN echo -e "SEND_GRID_SUPPORT_EMAIL=$SEND_GRID_SUPPORT_EMAIL" >> .env


RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY env ./.env
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# RUN yarn build

# If using npm comment out above and use below instead
RUN npm run build

# # Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app


ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.env ./.env
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
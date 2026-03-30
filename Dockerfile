# Build arguments
ARG BUILDOS=linux
ARG BUILDARCH=amd64

# First stage: build the app
FROM --platform=${BUILDOS}/${BUILDARCH} node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependencies files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy app source
COPY . .

# Build the app in standalone mode
RUN npm run build

# Second stage: production image
FROM --platform=${BUILDOS}/${BUILDARCH} node:22-alpine AS runner

# Set working directory
WORKDIR /app

# Copy standalone output and static files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Set environment variables (optional)
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Run the app
CMD ["node", "server.js"]

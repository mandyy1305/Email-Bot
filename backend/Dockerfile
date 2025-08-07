# # Use Node.js 18 Alpine as base image
# FROM node:18-alpine

# # Set working directory
# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci --only=production

# # Copy source code
# COPY . .

# # Create non-root user
# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S email-bot -u 1001

# # Create necessary directories with proper permissions
# RUN mkdir -p uploads logs && \
#     chown -R email-bot:nodejs uploads logs

# # Switch to non-root user
# USER email-bot

# # Expose port
# EXPOSE 3001

# # Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#     CMD node -e "require('http').get('http://localhost:3001/health', (res) => { \
#         if (res.statusCode === 200) process.exit(0); else process.exit(1); \
#     }).on('error', () => process.exit(1));"

# # Start the application
# CMD ["npm", "start"]

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs email-bot && \
    mkdir -p uploads logs && \
    chown -R email-bot:nodejs uploads logs

USER email-bot

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { \
        if (res.statusCode === 200) process.exit(0); else process.exit(1); \
    }).on('error', () => process.exit(1));"

CMD ["npm", "start"]

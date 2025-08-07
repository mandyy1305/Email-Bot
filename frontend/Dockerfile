# # Multi-stage build
# # Stage 1: Build the application
# FROM node:18-alpine AS builder

# # Set working directory
# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci

# # Copy source code
# COPY . .

# # Build the application
# RUN npm run build

# # Stage 2: Production image with Nginx
# FROM nginx:alpine

# # Copy build files to nginx html directory
# COPY --from=builder /app/dist /usr/share/nginx/html

# # Copy custom nginx configuration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Create non-root user
# RUN adduser -S frontend -u 1001 -G nginx

# # Change ownership of nginx files
# RUN chown -R frontend:nginx /var/cache/nginx && \
#     chown -R frontend:nginx /var/log/nginx && \
#     chown -R frontend:nginx /etc/nginx/conf.d && \
#     chown -R frontend:nginx /usr/share/nginx/html

# # Touch and chown the pid file
# RUN touch /var/run/nginx.pid && \
#     chown -R frontend:nginx /var/run/nginx.pid

# # Switch to non-root user
# USER frontend

# # Expose port
# EXPOSE 80

# # Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#     CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# # Start nginx
# CMD ["nginx", "-g", "daemon off;"]

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN adduser -S -u 1001 -g nginx frontend && \
    chown -R frontend:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html && \
    touch /var/run/nginx.pid && chown frontend:nginx /var/run/nginx.pid

USER frontend

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

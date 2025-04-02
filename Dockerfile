# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Detect directory structure and copy source
COPY . .

# Handle potential directory structures
RUN if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then \
      cd frontend && npm ci && npm run build; \
    elif [ -f "package.json" ]; then \
      npm ci && npm run build; \
    else \
      echo "Could not find valid Node.js project" && exit 1; \
    fi

# Runtime stage
FROM nginx:alpine

# Copy the built app to nginx server based on detected structure
RUN mkdir -p /usr/share/nginx/html
COPY --from=build /app/frontend/dist /usr/share/nginx/html/ 2>/dev/null || \
COPY --from=build /app/dist /usr/share/nginx/html/ 2>/dev/null || \
echo "No build output found"

# Create nginx config template with environment variable placeholders
RUN echo 'server { \
  listen 8080; \
  server_name _; \
  root /usr/share/nginx/html; \
  index index.html; \
  \
  # Enable gzip compression \
  gzip on; \
  gzip_min_length 1000; \
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript; \
  \
  # Handle API redirects \
  location /api/auth/ { \
    proxy_pass ${AUTH_SERVICE_URL}/api/auth/; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
  } \
  \
  location /api/ { \
    proxy_pass ${BACKEND_SERVICE_URL}/api/; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
  } \
  \
  # Handle SPA routing \
  location / { \
    try_files $uri $uri/ /index.html; \
    add_header Cache-Control "no-cache"; \
  } \
  \
  # Cache static assets \
  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
    expires 30d; \
    add_header Cache-Control "public, max-age=2592000"; \
  } \
  \
  # Error pages \
  error_page 404 /index.html; \
  error_page 500 502 503 504 /50x.html; \
  location = /50x.html { \
    root /usr/share/nginx/html; \
  } \
}' > /etc/nginx/templates/default.conf.template

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Expose port
EXPOSE 8080

# Command to run the container
CMD ["nginx", "-g", "daemon off;"]
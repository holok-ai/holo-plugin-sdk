FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install PostgreSQL client for audit service
RUN apk --no-cache add postgresql-client

# Remove workspace configuration and install from npm
RUN npm pkg delete workspaces && \
    npm install && \
    npm install \
      @holokai/holo-provider-claude \
      @holokai/holo-provider-openai \
      @holokai/holo-provider-ollama

# Copy source code
COPY src/ ./src/

# Create logs directory and set permissions
RUN mkdir -p /app/logs \
    && chmod 777 /app/logs

# Copy startup script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
COPY scripts/register-ts-node.mjs /app/register-ts-node.mjs
RUN chmod +x /app/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production

EXPOSE 3000

# Use the startup script to run all services
CMD ["/app/docker-entrypoint.sh"]

FROM node:18-alpine

WORKDIR /app

# Copy tsconfig files (app/tsconfig.json extends ../tsconfig.json)
COPY tsconfig.json /tsconfig.json
COPY app/tsconfig.json /app/tsconfig.json

# Copy package files
COPY app/package*.json /app/

# Install PostgreSQL client for audit service
RUN apk --no-cache add postgresql-client

# Install from npm
RUN npm install && \
    npm install \
      @holokai/holo-provider-claude@latest \
      @holokai/holo-provider-openai@latest \
      @holokai/holo-provider-ollama@latest

# Copy source code
COPY app/src/ ./src/

# Create logs directory and set permissions
RUN mkdir -p /app/logs \
    && chmod 777 /app/logs

# Copy startup script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
COPY app/scripts/register-ts-node.mjs /app/register-ts-node.mjs
RUN chmod +x /app/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production

EXPOSE 3000

# Use the startup script to run all services
CMD ["/app/docker-entrypoint.sh"]

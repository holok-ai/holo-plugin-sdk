FROM node:22-alpine

ARG BUILD_MODE=dev

WORKDIR /app

RUN apk --no-cache add postgresql-client

# Root tsconfig (app/tsconfig.json extends ../tsconfig.json)
COPY tsconfig.json /tsconfig.json

# --- Dev mode: install deps first (cached), then copy source ---
COPY package*.json /monorepo/
COPY tsconfig.json /monorepo/tsconfig.json
COPY app/package*.json /monorepo/app/
COPY plugins/types/package*.json /monorepo/plugins/types/
COPY plugins/sdk/package*.json /monorepo/plugins/sdk/
COPY plugins/holo-provider-openai/package*.json /monorepo/plugins/holo-provider-openai/
COPY plugins/holo-provider-claude/package*.json /monorepo/plugins/holo-provider-claude/
COPY plugins/holo-provider-ollama/package*.json /monorepo/plugins/holo-provider-ollama/
COPY plugins/holo-provider-gemini/package*.json /monorepo/plugins/holo-provider-gemini/

RUN if [ "$BUILD_MODE" = "dev" ]; then \
      cd /monorepo && npm install; \
    fi

# Dev source (only invalidates layers after npm install)
COPY app/ /monorepo/app/
COPY plugins/ /monorepo/plugins/

# --- Prod mode: app only, plugins from npm ---
COPY app/tsconfig.json /app/tsconfig.json
COPY app/package*.json /app/

RUN if [ "$BUILD_MODE" = "prod" ]; then \
      cd /app && npm install && \
      npm install \
        @holokai/holo-provider-claude@latest \
        @holokai/holo-provider-openai@latest \
        @holokai/holo-provider-ollama@latest \
        @holokai/holo-provider-gemini@latest; \
    fi

COPY app/src/ /app/src/
COPY app/scripts/ /app/scripts/

# Logs
RUN mkdir -p /app/logs && chmod 777 /app/logs

# Entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production
ENV BUILD_MODE=${BUILD_MODE}

EXPOSE 3000

CMD ["/app/docker-entrypoint.sh"]

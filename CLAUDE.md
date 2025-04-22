# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- **Install**: `npm install`
- **Start**: `npm start` or `node src/app.js`
- **Dev mode**: `npm run dev` (nodemon auto-restart)
- **Tests**: `npm test` (Jest)
- **Docker**: `docker-compose up -d` (add `--scale worker=N` to scale workers)

## Code Style
- **Imports**: Node built-ins first, then external deps, then local modules
- **Naming**: camelCase for variables/functions, kebab-case for files/directories
- **Structure**: 
  - `/src/api`: API endpoints (controllers/, middleware/, routes.js)
  - `/src/config`: App configuration
  - `/src/queue`: RabbitMQ messaging
  - `/src/utils`: Helper functions
  - `/src/worker`: Background processors

## Practices
- **Error handling**: Try/catch for async, structured error responses with HTTP codes
- **Logging**: Use Winston logger from utils/logger.js
- **Environment**: Node.js v18+, Express.js, RabbitMQ
- **After changes**: Run tests with `npm test` before committing

Always maintain existing patterns when modifying code. Create similar structure for new components.
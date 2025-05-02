require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  rabbitMq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    queues: {
      llmRequests: 'llm_requests',
      // The response queue will be dynamically created with server ID
      llmResponsesPrefix: 'llm_responses',
      // Audit queues for logging
      llmAudit: 'llm_requests_audit',
      llmResponsesAudit: 'llm_responses_audit',
      // Admin queues for worker management
      adminCommands: 'llm_admin_commands',
      adminResponsesPrefix: 'llm_admin_responses'
    },
    exchanges: {
      llmResponses: 'llm_responses', // Used for routing responses to server-specific queues
      llmRequests: 'llm_requests_exchange', // Used for fanout to request processors and audit
      admin: 'llm_admin', // Used for admin commands to workers
      adminResponses: 'llm_admin_responses' // Used for routing admin responses back to servers
    },
    // Queue expiration in milliseconds (1 hour)
    queueExpiration: 3600000
  },
  server: {
    // Generate a unique ID for this server instance
    id: process.env.SERVER_ID || `server_${Math.random().toString(36).substring(2, 10)}`
  },
  api: {
    requestTimeout: 300000, // 5 minutes
    streamTimeout: 600000,  // 10 minutes
  },
  worker: {
    maxConcurrency: 2,
    prefetch: 1,
  },
  // LLM provider settings
  llm: {
    // The LLM provider to use (mock, ollama)
    provider: process.env.LLM_PROVIDER || 'mock',
    
    // Provider-specific configurations
    providers: {
      // Mock provider for development/testing
      mock: {
        responseDelay: 100, // ms between tokens
      },
      
      // Ollama provider
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        timeout: parseInt(process.env.OLLAMA_TIMEOUT || '60000'),
      }
      
      // Add more providers here as needed
    }
  },
  
  // Legacy mock LLM settings (kept for backward compatibility)
  mockLlm: {
    enabled: process.env.NODE_ENV === 'development',
    responseDelay: 100, // ms between tokens
  },
  
  // Audit service configuration
  audit: {
    enabled: process.env.AUDIT_ENABLED === 'true' || false,
    postgres: {
      host: process.env.AUDIT_PG_HOST || 'localhost',
      port: parseInt(process.env.AUDIT_PG_PORT || '5432'),
      database: process.env.AUDIT_PG_DATABASE || 'llm_audit',
      user: process.env.AUDIT_PG_USER || 'postgres',
      password: process.env.AUDIT_PG_PASSWORD || 'postgrespassword'
    }
  },
  
  // Model registry configuration
  models: {
    // Whether to enable automatic model discovery on startup
    autoDiscovery: process.env.MODELS_AUTO_DISCOVERY === 'true' || false,
    // Default models enabled status
    enableNewModels: process.env.MODELS_ENABLE_NEW === 'true' || false,
    // Sync interval in milliseconds (default: 1 hour)
    syncInterval: parseInt(process.env.MODELS_SYNC_INTERVAL || '3600000'),
    // Use the same Postgres connection as audit service
    postgres: {
      host: process.env.AUDIT_PG_HOST || 'localhost',
      port: parseInt(process.env.AUDIT_PG_PORT || '5432'),
      database: process.env.AUDIT_PG_DATABASE || 'llm_audit',
      user: process.env.AUDIT_PG_USER || 'postgres',
      password: process.env.AUDIT_PG_PASSWORD || 'postgrespassword'
    }
  }
};

module.exports = { config };

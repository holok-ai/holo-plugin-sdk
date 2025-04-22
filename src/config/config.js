require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  rabbitMq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    queues: {
      llmRequests: 'llm_requests',
      llmResponses: 'llm_responses'
    },
    exchanges: {
      llmRequests: 'llm_requests_exchange',
      llmResponses: 'llm_responses_exchange'
    },
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
  }
};

module.exports = { config };

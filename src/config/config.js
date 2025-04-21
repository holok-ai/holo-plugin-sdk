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
  // Mock LLM settings (for development/testing)
  mockLlm: {
    enabled: process.env.NODE_ENV === 'development',
    responseDelay: 100, // ms between tokens
  }
};

module.exports = { config };

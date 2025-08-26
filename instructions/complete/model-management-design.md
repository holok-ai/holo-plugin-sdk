# LLM Proxy Model Management System Design

## Goals
- Enable users to view available models (public and Ollama-based)
- Allow users to enable/disable models with changes propagated to workers
- Provide worker monitoring and management via UI
- Support future infrastructure orchestration

## Architecture Components

### 1. Model Registry

The Model Registry manages model metadata and configuration in PostgreSQL.

```javascript
// src/models/model-registry.js
class ModelRegistry {
  constructor(pgPool) {
    this.pgPool = pgPool; // PostgreSQL connection
  }
  
  async initialize() {
    // Create tables if not exist
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS models (
        id VARCHAR(255) PRIMARY KEY,
        provider VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        capabilities JSONB,
        parameters JSONB,
        metadata JSONB,
        status JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }
  
  async getAllModels() {
    const { rows } = await this.pgPool.query('SELECT * FROM models');
    return rows;
  }
  
  async getModelById(id) {
    const { rows } = await this.pgPool.query('SELECT * FROM models WHERE id = $1', [id]);
    return rows[0] || null;
  }
  
  async getModelsByProvider(provider) {
    const { rows } = await this.pgPool.query('SELECT * FROM models WHERE provider = $1', [provider]);
    return rows;
  }
  
  async upsertModel(model) {
    // Insert or update model record
    // Returns updated model
  }
  
  async updateModelStatus(id, status) {
    const result = await this.pgPool.query(
      'UPDATE models SET status = status || $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(status), id]
    );
    return result.rows[0] || null;
  }
  
  async syncWithProvider(providerName, providerInstance) {
    // Fetch models from provider
    // Update local registry
  }
}
```

### 2. Worker Manager

The Worker Manager handles commands to workers via RabbitMQ.

```javascript
// src/worker/worker-manager.js
class WorkerManager {
  constructor(queueProducer) {
    this.queueProducer = queueProducer;
    this.responseHandlers = new Map();
  }
  
  async loadModel(modelId, params = {}) {
    return this.sendCommand('model.load', { modelId, params });
  }
  
  async unloadModel(modelId) {
    return this.sendCommand('model.unload', { modelId });
  }
  
  async updateModelConfig(modelId, config) {
    return this.sendCommand('model.config', { modelId, config });
  }
  
  async getWorkerStatus() {
    return this.sendCommand('worker.status', {}, true);
  }
  
  async restartWorker(workerId) {
    return this.sendCommand('worker.restart', { workerId });
  }
  
  async sendCommand(action, payload, expectResponse = false) {
    const messageId = uuidv4();
    await this.queueProducer.sendToExchange(
      'llm.admin', 
      action,
      { messageId, ...payload }
    );
    
    if (expectResponse) {
      // Setup response handling logic here
    }
    
    return { messageId };
  }
}
```

### 3. Model Definition Structure

```javascript
{
    id: "ollama:llama2",              // Unique identifier
        providerType
:
    "ollama",               // AiProvider name
        name
:
    "Llama 2",                  // Display name
        description
:
    "Open source LLM",   // Description
        capabilities
:
    {                   // Supported operations
        chat: true,
            generate
    :
        true
    }
,
    parameters: {                     // Default parameters
        maxTokens: 2048,
            temperature
    :
        0.7
    }
,
    metadata: {                       // Additional info
        contextSize: 4096,
            tags
    :
        ["open-source", "local"]
    }
,
    status: {                         // Runtime status
        enabled: true,                  // Available to users
            available
    :
        true,                // Actually working
            lastUpdated
    :
        "2024-05-02T..."
    }
}
```

### 4. API Endpoints

New endpoints for model management:

```
GET /api/models - List all models
GET /api/models/:id - Get specific model
PUT /api/models/:id - Update model
GET /api/models/:id/status - Get model status
PUT /api/models/:id/status - Update model status (enable/disable)

GET /api/workers - List all workers
GET /api/workers/:id - Get worker status
POST /api/workers/:id/command - Send command to worker
```

### 5. RabbitMQ Extensions

New exchanges and queues for administration:

```javascript
// Add to config.ts
module.exports = {
  // ... existing config
  rabbitmq: {
    // ... existing queues
    adminExchange: 'llm.admin',
    adminRoutingKey: 'admin',
    workerResponseExchange: 'llm.worker.response',
  }
}
```

### 6. Worker Command Handling

Extend workers to handle administrative commands:

```javascript
// Extension to src/worker/llm-worker.js
function setupAdminConsumer(channel) {
  channel.consume(
    config.rabbitmq.adminQueue, 
    async (message) => {
      const { action, messageId, ...payload } = JSON.parse(message.content.toString());
      
      let response;
      try {
        switch (action) {
          case 'model.load':
            response = await handleModelLoad(payload);
            break;
          case 'model.unload':
            response = await handleModelUnload(payload);
            break;
          case 'worker.status':
            response = await getWorkerStatus();
            break;
          // Add other command handlers
        }
        
        // Send response if needed
        channel.publish(
          config.rabbitmq.workerResponseExchange,
          messageId,
          Buffer.from(JSON.stringify(response))
        );
      } catch (error) {
        logger.error(`Error handling admin command: ${error.message}`);
        // Send error response
      }
      
      channel.ack(message);
    },
    { noAck: false }
  );
}
```

## Implementation Plan

1. Create PostgreSQL model schema
2. Implement ModelRegistry class
3. Create WorkerManager for command handling
4. Extend LLM providers with model support
5. Update RabbitMQ configuration
6. Add admin API endpoints
7. Implement worker command handling
8. Create UI components for model management

## Future Considerations

- Add caching for model registry for better performance
- Implement worker telemetry for status monitoring
- Create infrastructure provider adapters
- Add model versioning
- Implement automated model discovery

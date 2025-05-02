/**
 * Model Registry for managing LLM models
 * Handles model metadata, availability, and configuration
 */
const { Pool } = require('pg');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class ModelRegistry {
  constructor() {
    this.pgPool = null;
    this.initialized = false;
  }

  /**
   * Initialize the model registry
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    try {
      // Initialize PostgreSQL connection
      this.pgPool = new Pool({
        host: config.models.postgres.host,
        port: config.models.postgres.port,
        database: config.models.postgres.database,
        user: config.models.postgres.user,
        password: config.models.postgres.password,
        max: 10, // Max number of clients in the pool
        idleTimeoutMillis: 30000
      });
      
      // Test the database connection
      await this.pgPool.query('SELECT NOW()');
      logger.info('Successfully connected to PostgreSQL for model registry');
      
      // Create model registry tables
      await this._createModelTables();
      
      this.initialized = true;
      logger.info('Model registry initialized successfully');
      
      // Auto-discover models if enabled
      if (config.models.autoDiscovery) {
        this.syncWithAllProviders()
          .catch(err => logger.error(`Error during initial model sync: ${err.message}`));
      }
    } catch (error) {
      logger.error(`Failed to initialize model registry: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create the model registry tables if they don't exist
   */
  async _createModelTables() {
    try {
      // Create models table
      const createModelsTableSQL = `
        CREATE TABLE IF NOT EXISTS models (
          id VARCHAR(255) PRIMARY KEY,
          provider VARCHAR(100) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          capabilities JSONB NOT NULL DEFAULT '{}',
          parameters JSONB NOT NULL DEFAULT '{}',
          metadata JSONB NOT NULL DEFAULT '{}',
          status JSONB NOT NULL DEFAULT '{"enabled": false, "available": false}',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        -- Index for faster provider lookups
        CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);
      `;
      
      await this.pgPool.query(createModelsTableSQL);
      
      logger.info('Model registry tables created or already exist');
    } catch (error) {
      logger.error(`Error creating model registry tables: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all models
   * @param {Object} filters - Optional filters (provider, enabled, available)
   * @returns {Array} - Array of model objects
   */
  async getAllModels(filters = {}) {
    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.initialize();
      }
      
      let query = 'SELECT * FROM models';
      const queryParams = [];
      const conditions = [];
      
      // Apply filters if provided
      if (filters.provider) {
        conditions.push(`provider = $${queryParams.length + 1}`);
        queryParams.push(filters.provider);
      }
      
      if (filters.enabled !== undefined) {
        conditions.push(`status->>'enabled' = $${queryParams.length + 1}`);
        queryParams.push(filters.enabled.toString());
      }
      
      if (filters.available !== undefined) {
        conditions.push(`status->>'available' = $${queryParams.length + 1}`);
        queryParams.push(filters.available.toString());
      }
      
      // Add WHERE clause if we have conditions
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      // Add ORDER BY clause
      query += ' ORDER BY provider, name';
      
      const result = await this.pgPool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching models: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific model by ID
   * @param {string} id - Model identifier
   * @returns {Object|null} - Model object or null if not found
   */
  async getModel(id) {
    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.initialize();
      }
      
      const result = await this.pgPool.query(
        'SELECT * FROM models WHERE id = $1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Error fetching model ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a model's status
   * @param {string} id - Model identifier
   * @param {Object} status - Status updates {enabled, available}
   * @returns {Object|null} - Updated model or null if not found
   */
  async updateModelStatus(id, status) {
    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.initialize();
      }
      
      const result = await this.pgPool.query(
        'UPDATE models SET status = status || $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(status), id]
      );
      
      if (result.rows.length === 0) {
        logger.warn(`Attempted to update status for non-existent model: ${id}`);
        return null;
      }
      
      logger.info(`Updated status for model ${id}: ${JSON.stringify(status)}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating model status for ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update model parameters
   * @param {string} id - Model identifier
   * @param {Object} parameters - Parameter updates
   * @returns {Object|null} - Updated model or null if not found
   */
  async updateModelParameters(id, parameters) {
    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.initialize();
      }
      
      const result = await this.pgPool.query(
        'UPDATE models SET parameters = parameters || $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(parameters), id]
      );
      
      if (result.rows.length === 0) {
        logger.warn(`Attempted to update parameters for non-existent model: ${id}`);
        return null;
      }
      
      logger.info(`Updated parameters for model ${id}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating model parameters for ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update a model
   * @param {Object} model - Model data
   * @returns {Object} - Created or updated model
   */
  async upsertModel(model) {
    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Ensure the model has all required fields
      if (!model.id || !model.provider || !model.name) {
        throw new Error('Model is missing required fields (id, provider, name)');
      }
      
      // Apply default status if not provided
      if (!model.status) {
        model.status = {
          enabled: config.models.enableNewModels,
          available: false,
          lastUpdated: new Date().toISOString()
        };
      } else {
        model.status.lastUpdated = new Date().toISOString();
      }
      
      // Apply default structures for JSON fields if missing
      model.capabilities = model.capabilities || {};
      model.parameters = model.parameters || {};
      model.metadata = model.metadata || {};
      
      // Insert or update the model
      const result = await this.pgPool.query(`
        INSERT INTO models (
          id, provider, name, description, capabilities, parameters, metadata, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          provider = $2,
          name = $3,
          description = $4,
          capabilities = $5,
          parameters = $6,
          metadata = $7,
          status = models.status || $8,
          updated_at = NOW()
        RETURNING *
      `, [
        model.id,
        model.provider,
        model.name,
        model.description || '',
        JSON.stringify(model.capabilities),
        JSON.stringify(model.parameters),
        JSON.stringify(model.metadata),
        JSON.stringify(model.status)
      ]);
      
      logger.info(`Upserted model ${model.id} (${model.provider}/${model.name})`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error upserting model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a model from the registry
   * @param {string} id - Model identifier
   * @returns {boolean} - True if deleted, false if not found
   */
  async deleteModel(id) {
    try {
      const result = await this.pgPool.query(
        'DELETE FROM models WHERE id = $1',
        [id]
      );
      
      if (result.rowCount === 0) {
        logger.warn(`Attempted to delete non-existent model: ${id}`);
        return false;
      }
      
      logger.info(`Deleted model ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting model ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync models from a specific provider
   * @param {string} providerName - Provider identifier
   * @param {Object} providerInstance - Provider instance with getModels method
   * @returns {Array} - Array of updated models
   */
  async syncWithProvider(providerName, providerInstance) {
    try {
      logger.info(`Starting model sync with provider: ${providerName}`);
      
      if (!providerInstance.getModels) {
        logger.warn(`Provider ${providerName} does not implement getModels method`);
        return [];
      }
      
      // Get models from provider
      const providerModels = await providerInstance.getModels();
      logger.info(`Retrieved ${providerModels.length} models from provider ${providerName}`);
      
      // Upsert each model
      const updatedModels = [];
      for (const model of providerModels) {
        // Ensure model has the required provider-specific ID format
        const modelId = model.id || `${providerName}:${model.name.replace(/\s+/g, '-').toLowerCase()}`;
        
        const upsertedModel = await this.upsertModel({
          id: modelId,
          provider: providerName,
          name: model.name,
          description: model.description || '',
          capabilities: model.capabilities || {},
          parameters: model.parameters || {},
          metadata: model.metadata || {},
          status: {
            available: true,
            // Keep existing enabled status or use default
            enabled: model.status?.enabled !== undefined 
              ? model.status.enabled 
              : config.models.enableNewModels
          }
        });
        
        updatedModels.push(upsertedModel);
      }
      
      logger.info(`Successfully synced ${updatedModels.length} models from provider ${providerName}`);
      return updatedModels;
    } catch (error) {
      logger.error(`Error syncing models with provider ${providerName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync models from all configured providers
   * @returns {Object} - Object with results for each provider
   */
  async syncWithAllProviders() {
    try {
      logger.info('Starting model sync with all providers');
      
      const results = {};
      const llmFactory = require('../llm/factory');
      
      // Get all provider names from config
      const providerNames = Object.keys(config.llm.providers);
      
      for (const providerName of providerNames) {
        try {
          // Create provider instance
          const provider = llmFactory.createProvider(providerName);
          
          // Skip if provider couldn't be created
          if (!provider) {
            logger.warn(`Could not create provider instance for ${providerName}, skipping sync`);
            results[providerName] = { success: false, error: 'Provider creation failed' };
            continue;
          }
          
          // Sync with provider
          const models = await this.syncWithProvider(providerName, provider);
          results[providerName] = { success: true, count: models.length };
        } catch (error) {
          logger.error(`Error syncing with provider ${providerName}: ${error.message}`);
          results[providerName] = { success: false, error: error.message };
        }
      }
      
      logger.info(`Completed model sync with all providers: ${JSON.stringify(results)}`);
      return results;
    } catch (error) {
      logger.error(`Error in syncWithAllProviders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Shutdown the model registry
   */
  async shutdown() {
    if (this.pgPool) {
      await this.pgPool.end();
      logger.info('Closed PostgreSQL connection pool for model registry');
    }
    this.initialized = false;
  }
}

// Create a singleton instance
const modelRegistry = new ModelRegistry();

module.exports = modelRegistry;
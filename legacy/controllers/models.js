/**
 * Controller for model management endpoints
 */
const modelRegistry = require('../../models/model-registry');
const workerManager = require('../../worker/worker-manager');
const logger = require('../../utils/logger');

/**
 * Get all models
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getAllModels(req, res) {
  try {
    // Initialize model registry if needed
    if (!modelRegistry.initialized) {
      await modelRegistry.initialize();
    }
    
    // Parse query params for filtering
    const filters = {};
    
    if (req.query.provider) {
      filters.provider = req.query.provider;
    }
    
    if (req.query.enabled !== undefined) {
      filters.enabled = req.query.enabled === 'true';
    }
    
    if (req.query.available !== undefined) {
      filters.available = req.query.available === 'true';
    }
    
    const models = await modelRegistry.getAllModels(filters);
    res.json({ models });
  } catch (error) {
    logger.error(`Error getting models: ${error.message}`);
    res.status(500).json({
      error: 'Failed to retrieve models',
      message: error.message
    });
  }
}

/**
 * Get model by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getModelById(req, res) {
  try {
    const { id } = req.params;
    const model = await modelRegistry.getModel(id);
    
    if (!model) {
      return res.status(404).json({
        error: 'Model not found',
        message: `No model found with ID: ${id}`
      });
    }
    
    res.json({ model });
  } catch (error) {
    logger.error(`Error getting model ${req.params.id}: ${error.message}`);
    res.status(500).json({
      error: 'Failed to retrieve model',
      message: error.message
    });
  }
}

/**
 * Update model
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updateModel(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if model exists
    const existingModel = await modelRegistry.getModel(id);
    if (!existingModel) {
      return res.status(404).json({
        error: 'Model not found',
        message: `No model found with ID: ${id}`
      });
    }
    
    // Apply updates
    let updatedModel;
    
    // If updating status
    if (updates.status) {
      updatedModel = await modelRegistry.updateModelStatus(id, updates.status);
      
      // Propagate status changes to workers if enabled/disabled changed
      if (updates.status.enabled !== undefined) {
        try {
          if (updates.status.enabled) {
            await workerManager.loadModel(id);
            logger.info(`Sent command to load model ${id} on workers`);
          } else {
            await workerManager.unloadModel(id);
            logger.info(`Sent command to unload model ${id} from workers`);
          }
        } catch (workerError) {
          logger.error(`Error propagating model status to workers: ${workerError.message}`);
          // Continue despite worker error
        }
      }
    }
    
    // If updating parameters
    if (updates.parameters) {
      updatedModel = await modelRegistry.updateModelParameters(id, updates.parameters);
      
      // Propagate parameter changes to workers
      try {
        await workerManager.updateModelConfig(id, updates.parameters);
        logger.info(`Sent command to update parameters for model ${id} on workers`);
      } catch (workerError) {
        logger.error(`Error propagating parameters to workers: ${workerError.message}`);
        // Continue despite worker error
      }
    }
    
    // If model data should be fully updated, use upsert
    if (updates.name || updates.description || updates.capabilities || updates.metadata) {
      const modelData = {
        ...existingModel,
        ...updates,
        id // Ensure ID remains the same
      };
      
      updatedModel = await modelRegistry.upsertModel(modelData);
    }
    
    res.json({ 
      model: updatedModel,
      message: 'Model updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating model ${req.params.id}: ${error.message}`);
    res.status(500).json({
      error: 'Failed to update model',
      message: error.message
    });
  }
}

/**
 * Sync models with provider
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function syncModels(req, res) {
  try {
    const { provider } = req.query;
    let results;
    
    if (provider) {
      // Sync with specific provider
      const llmFactory = require('../../llm/factory');
      const providerInstance = llmFactory.createProvider(provider);
      
      if (!providerInstance) {
        return res.status(400).json({
          error: 'Invalid provider',
          message: `Provider '${provider}' not found or could not be created`
        });
      }
      
      const models = await modelRegistry.syncWithProvider(provider, providerInstance);
      results = { [provider]: { success: true, count: models.length } };
    } else {
      // Sync with all providers
      results = await modelRegistry.syncWithAllProviders();
    }
    
    res.json({
      message: 'Model sync completed',
      results
    });
  } catch (error) {
    logger.error(`Error syncing models: ${error.message}`);
    res.status(500).json({
      error: 'Failed to sync models',
      message: error.message
    });
  }
}

/**
 * Get worker status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getWorkerStatus(req, res) {
  try {
    const { workerId } = req.params;
    const status = await workerManager.getWorkerStatus(workerId);
    
    res.json({ status });
  } catch (error) {
    logger.error(`Error getting worker status: ${error.message}`);
    res.status(500).json({
      error: 'Failed to get worker status',
      message: error.message
    });
  }
}

/**
 * Send command to worker
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function sendWorkerCommand(req, res) {
  try {
    const { workerId } = req.params;
    const { command, params } = req.body;
    
    if (!command) {
      return res.status(400).json({
        error: 'Missing command',
        message: 'Command field is required'
      });
    }
    
    let result;
    
    switch (command) {
      case 'restart':
        result = await workerManager.restartWorker(workerId);
        break;
      case 'load_model':
        if (!params || !params.modelId) {
          return res.status(400).json({
            error: 'Missing modelId',
            message: 'modelId is required for load_model command'
          });
        }
        result = await workerManager.loadModel(params.modelId, params.options || {});
        break;
      case 'unload_model':
        if (!params || !params.modelId) {
          return res.status(400).json({
            error: 'Missing modelId',
            message: 'modelId is required for unload_model command'
          });
        }
        result = await workerManager.unloadModel(params.modelId);
        break;
      default:
        return res.status(400).json({
          error: 'Invalid command',
          message: `Command '${command}' is not supported`
        });
    }
    
    res.json({
      message: 'Command sent successfully',
      result
    });
  } catch (error) {
    logger.error(`Error sending worker command: ${error.message}`);
    res.status(500).json({
      error: 'Failed to send worker command',
      message: error.message
    });
  }
}

module.exports = {
  getAllModels,
  getModelById,
  updateModel,
  syncModels,
  getWorkerStatus,
  sendWorkerCommand
};
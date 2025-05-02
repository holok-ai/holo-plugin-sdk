/**
 * Controller for worker management endpoints
 */
const workerManager = require('../../worker/worker-manager');
const logger = require('../../utils/logger');

/**
 * Get status of all workers or a specific worker
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getWorkerStatus(req, res) {
  try {
    const { workerId } = req.params;
    
    // Initialize worker manager
    await workerManager.initialize();
    
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
    
    // Initialize worker manager
    await workerManager.initialize();
    
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
  getWorkerStatus,
  sendWorkerCommand
};
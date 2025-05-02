// Dashboard JavaScript

// Chart objects
let workerChart = null;
let modelChart = null;

// Store current section 
let currentSection = 'dashboard';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Set up navigation
  setupNavigation();
  
  // Initial data load
  loadDashboardData();
  
  // Set up auto-refresh (every 30 seconds)
  setInterval(() => {
    if (currentSection === 'dashboard') {
      loadDashboardData();
    } else if (currentSection === 'requests') {
      loadRequestHistory();
    } else if (currentSection === 'workers') {
      loadWorkerPerformance();
    }
  }, 30000);
});

// Set up navigation between sections
function setupNavigation() {
  // Get all navigation links
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Add click event to each link
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      link.classList.add('active');
      
      // Get the section ID from the href
      const sectionId = link.getAttribute('href').substring(1);
      
      // Update current section
      currentSection = sectionId;
      
      // Hide all sections
      document.getElementById('dashboard-section').classList.add('d-none');
      document.getElementById('requests-section').classList.add('d-none');
      document.getElementById('workers-section').classList.add('d-none');
      document.getElementById('models-section').classList.add('d-none');
      
      // Show the selected section
      if (sectionId === 'dashboard') {
        document.getElementById('dashboard-section').classList.remove('d-none');
        loadDashboardData();
      } else if (sectionId === 'requests') {
        document.getElementById('requests-section').classList.remove('d-none');
        loadRequestHistory();
      } else if (sectionId === 'workers') {
        document.getElementById('workers-section').classList.remove('d-none');
        loadWorkerPerformance();
        loadLiveWorkerStatus();
      } else if (sectionId === 'models') {
        document.getElementById('models-section').classList.remove('d-none');
        loadModels();
      }
    });
  });
}

// Load dashboard data from API
async function loadDashboardData() {
  try {
    const response = await fetch('/api/monitoring/dashboard');
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    const data = await response.json();
    
    // Update queue metrics
    updateQueueMetrics(data.queueMetrics);
    
    // Update recent requests table
    updateRecentRequests(data.recentRequests);
    
    // Update worker performance chart
    updateWorkerChart(data.workerMetrics);
    
    // Update model usage chart
    updateModelChart(data.modelMetrics);
    
    // Update models count
    document.getElementById('models-count').textContent = data.modelMetrics.length;
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showErrorAlert('Failed to load dashboard data. Please try again later.');
  }
}

// Update queue metrics cards
function updateQueueMetrics(metrics) {
  document.getElementById('queue-depth').textContent = metrics.queueDepth;
  document.getElementById('requests-processed').textContent = metrics.requestsProcessed;
  document.getElementById('avg-response-time').textContent = formatTime(metrics.responseTime);
}

// Format time in milliseconds to a readable format
function formatTime(ms) {
  if (!ms) return '0';
  return Math.round(ms) + 'ms';
}

// Update recent requests table
function updateRecentRequests(requests) {
  const tableBody = document.getElementById('recent-requests');
  
  if (!requests || requests.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No requests found</td></tr>';
    return;
  }
  
  let html = '';
  
  requests.forEach(request => {
    html += `
      <tr>
        <td class="truncate">${request.request_id.substring(0, 8)}...</td>
        <td>${request.request_type}</td>
        <td>${request.model}</td>
        <td>${formatDate(request.request_time)}</td>
        <td>${request.processing_time ? formatTime(request.processing_time) : 'N/A'}</td>
        <td>${request.total_tokens || 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewRequestDetails('${request.request_id}')">
            Details
          </button>
        </td>
      </tr>
    `;
  });
  
  tableBody.innerHTML = html;
}

// Update worker performance chart
function updateWorkerChart(workerMetrics) {
  const ctx = document.getElementById('worker-chart').getContext('2d');
  
  if (workerChart) {
    workerChart.destroy();
  }
  
  if (!workerMetrics || workerMetrics.length === 0) {
    ctx.font = '16px Arial';
    ctx.fillText('No worker data available', 10, 50);
    return;
  }
  
  // Prepare data for chart
  const labels = workerMetrics.map(worker => worker.worker_id.substring(0, 8) + '...');
  const requestsData = workerMetrics.map(worker => worker.requests_processed);
  const tokensPerSecData = workerMetrics.map(worker => Math.round(worker.avg_tokens_per_second * 10) / 10);
  
  workerChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Requests Processed',
          data: requestsData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Tokens/Sec',
          data: tokensPerSecData,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          title: {
            display: true,
            text: 'Requests'
          },
          beginAtZero: true
        },
        y1: {
          position: 'right',
          title: {
            display: true,
            text: 'Tokens/Sec'
          },
          beginAtZero: true,
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

// Update model usage chart
function updateModelChart(modelMetrics) {
  const ctx = document.getElementById('model-chart').getContext('2d');
  
  if (modelChart) {
    modelChart.destroy();
  }
  
  if (!modelMetrics || modelMetrics.length === 0) {
    ctx.font = '16px Arial';
    ctx.fillText('No model data available', 10, 50);
    return;
  }
  
  // Prepare data for chart
  const labels = modelMetrics.map(model => model.model);
  const requestData = modelMetrics.map(model => model.request_count);
  const tokensData = modelMetrics.map(model => Math.round(model.avg_tokens));
  
  // Generate random colors for each model
  const backgroundColors = modelMetrics.map(() => 
    `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.5)`
  );
  
  modelChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Requests',
          data: requestData,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              const requests = requestData[index];
              const tokens = tokensData[index];
              return [
                `Requests: ${requests}`,
                `Avg Tokens: ${tokens}`
              ];
            }
          }
        }
      }
    }
  });
}

// Load request history
async function loadRequestHistory() {
  try {
    const response = await fetch('/api/monitoring/requests?limit=20');
    
    if (!response.ok) {
      throw new Error('Failed to fetch request history');
    }
    
    const data = await response.json();
    
    const tableBody = document.getElementById('requests-history');
    
    if (!data.requests || data.requests.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No requests found</td></tr>';
      return;
    }
    
    let html = '';
    
    data.requests.forEach(request => {
      const promptText = request.prompt ? 
        (request.prompt.length > 50 ? request.prompt.substring(0, 50) + '...' : request.prompt) : 
        'N/A';
      
      html += `
        <tr>
          <td class="truncate">${request.request_id.substring(0, 8)}...</td>
          <td>${request.request_type}</td>
          <td>${request.model}</td>
          <td class="truncate">${promptText}</td>
          <td>${formatDate(request.request_time)}</td>
          <td>${request.processing_time ? formatTime(request.processing_time) : 'N/A'}</td>
          <td>${request.total_tokens || 'N/A'}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="viewRequestDetails('${request.request_id}')">
              Details
            </button>
          </td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading request history:', error);
    showErrorAlert('Failed to load request history. Please try again later.');
  }
}

// Load worker performance data
async function loadWorkerPerformance() {
  try {
    const response = await fetch('/api/monitoring/workers');
    
    if (!response.ok) {
      throw new Error('Failed to fetch worker performance data');
    }
    
    const data = await response.json();
    
    const tableBody = document.getElementById('workers-list');
    
    if (!data.workers || data.workers.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No worker data found</td></tr>';
      return;
    }
    
    let html = '';
    
    data.workers.forEach(worker => {
      html += `
        <tr>
          <td>${worker.worker_id}</td>
          <td>${worker.requests_processed}</td>
          <td>${formatTime(worker.avg_processing_time)}</td>
          <td>${Math.round(worker.avg_tokens || 0)}</td>
          <td>${worker.avg_tokens_per_second ? Math.round(worker.avg_tokens_per_second * 10) / 10 : 'N/A'}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="openWorkerCommandModal('${worker.worker_id}')">
              <i class="bi bi-terminal"></i> Command
            </button>
          </td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading worker performance:', error);
    showErrorAlert('Failed to load worker performance data. Please try again later.');
  }
}

// Refresh worker stats
function refreshWorkerStats() {
  loadWorkerPerformance();
}

// Load live worker status from admin API
async function loadLiveWorkerStatus() {
  try {
    const response = await fetch('/api/admin/workers');
    
    if (!response.ok) {
      throw new Error('Failed to fetch live worker status');
    }
    
    const data = await response.json();
    
    const tableBody = document.getElementById('live-workers-list');
    
    if (!data.status || !Array.isArray(data.status)) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No live worker data available</td></tr>';
      return;
    }
    
    let html = '';
    
    data.status.forEach(worker => {
      // Format uptime
      const uptime = formatUptime(worker.uptime);
      
      // Format memory usage
      const memoryUsage = `${worker.memory.heapUsed}/${worker.memory.heapTotal} MB`;
      
      // Format active models
      const activeModels = worker.stats.activeModels.length > 0 
        ? worker.stats.activeModels.map(m => m.name).join(', ')
        : 'None';
      
      html += `
        <tr>
          <td>${worker.workerId}</td>
          <td><span class="badge bg-success">Active</span></td>
          <td>${uptime}</td>
          <td>${memoryUsage}</td>
          <td class="truncate">${activeModels}</td>
          <td>
            <button class="btn btn-sm btn-primary me-1" onclick="viewWorkerDetails('${worker.workerId}')">
              <i class="bi bi-info-circle"></i> Details
            </button>
            <button class="btn btn-sm btn-warning" onclick="openWorkerCommandModal('${worker.workerId}')">
              <i class="bi bi-terminal"></i> Command
            </button>
          </td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading live worker status:', error);
    const tableBody = document.getElementById('live-workers-list');
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load worker status. Workers may not be running or RabbitMQ is not responding.</td></tr>';
  }
}

// Refresh live worker status
function refreshLiveWorkerStatus() {
  loadLiveWorkerStatus();
}

// Format uptime in a human-readable format
function formatUptime(ms) {
  if (!ms) return 'Unknown';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// View worker details
async function viewWorkerDetails(workerId) {
  try {
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('workerDetailsModal'));
    modal.show();
    
    // Show loading state
    document.getElementById('worker-details-content').innerHTML = `
      <div class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `;
    
    // Fetch worker details
    const response = await fetch(`/api/admin/workers/${workerId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch worker details');
    }
    
    const data = await response.json();
    
    // Format worker details
    const worker = data.status;
    
    const html = `
      <div class="worker-details-section">
        <h6>Worker Information</h6>
        <div class="row">
          <div class="col-md-6">
            <div class="metric-item">
              <span class="metric-label">Worker ID:</span>
              <span class="metric-value">${worker.workerId}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Status:</span>
              <span class="metric-value"><span class="badge bg-success">Active</span></span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Uptime:</span>
              <span class="metric-value">${formatUptime(worker.uptime)}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="metric-item">
              <span class="metric-label">Memory Usage:</span>
              <span class="metric-value">${worker.memory.heapUsed}/${worker.memory.heapTotal} MB</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Active Connections:</span>
              <span class="metric-value">${worker.connections.active}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="worker-details-section">
        <h6>Worker Statistics</h6>
        <div class="row">
          <div class="col-md-4">
            <div class="metric-item">
              <span class="metric-label">Total Requests:</span>
              <span class="metric-value">${worker.stats.totalRequests}</span>
            </div>
          </div>
          <div class="col-md-4">
            <div class="metric-item">
              <span class="metric-label">Generate Requests:</span>
              <span class="metric-value">${worker.stats.requestsProcessed.generate}</span>
            </div>
          </div>
          <div class="col-md-4">
            <div class="metric-item">
              <span class="metric-label">Chat Requests:</span>
              <span class="metric-value">${worker.stats.requestsProcessed.chat}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="worker-details-section">
        <h6>Active Models</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Model ID</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${worker.stats.activeModels.length > 0 ? 
                worker.stats.activeModels.map(model => `
                  <tr>
                    <td>${model.id}</td>
                    <td>${model.name}</td>
                    <td>${model.loaded ? 
                      '<span class="badge bg-success">Loaded</span>' : 
                      '<span class="badge bg-warning">Unloaded</span>'
                    }</td>
                  </tr>
                `).join('') : 
                '<tr><td colspan="3" class="text-center">No active models</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.getElementById('worker-details-content').innerHTML = html;
    
  } catch (error) {
    console.error('Error loading worker details:', error);
    document.getElementById('worker-details-content').innerHTML = `
      <div class="alert alert-danger">
        Failed to load worker details. Please try again later.
      </div>
    `;
  }
}

// Open worker command modal
function openWorkerCommandModal(workerId) {
  // Set worker ID in hidden field
  document.getElementById('command-worker-id').value = workerId;
  
  // Reset form
  document.getElementById('command-type').value = '';
  document.getElementById('model-param-group').classList.add('d-none');
  
  // Load available models for the dropdown
  loadCommandModelOptions();
  
  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById('workerCommandModal'));
  modal.show();
  
  // Add change event to command type
  document.getElementById('command-type').addEventListener('change', function() {
    const commandType = this.value;
    
    if (commandType === 'load_model' || commandType === 'unload_model') {
      document.getElementById('model-param-group').classList.remove('d-none');
    } else {
      document.getElementById('model-param-group').classList.add('d-none');
    }
  });
}

// Load models for command dropdown
async function loadCommandModelOptions() {
  try {
    const response = await fetch('/api/admin/models');
    
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    
    const data = await response.json();
    
    const select = document.getElementById('command-model-id');
    
    // Clear existing options except the first one
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    // Add models to dropdown
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `${model.name} (${model.id})`;
        select.appendChild(option);
      });
    }
    
  } catch (error) {
    console.error('Error loading models for command:', error);
  }
}

// Send worker command
async function sendWorkerCommand() {
  const workerId = document.getElementById('command-worker-id').value;
  const commandType = document.getElementById('command-type').value;
  
  if (!commandType) {
    alert('Please select a command');
    return;
  }
  
  let params = {};
  
  if (commandType === 'load_model' || commandType === 'unload_model') {
    const modelId = document.getElementById('command-model-id').value;
    if (!modelId) {
      alert('Please select a model');
      return;
    }
    params.modelId = modelId;
  }
  
  try {
    // Disable submit button
    const submitButton = document.querySelector('#workerCommandModal .btn-primary');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
    
    // Send command
    const response = await fetch(`/api/admin/workers/${workerId}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        command: commandType,
        params
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send command');
    }
    
    const data = await response.json();
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('workerCommandModal')).hide();
    
    // Show success message
    alert('Command sent successfully');
    
    // Refresh worker status
    loadLiveWorkerStatus();
    
  } catch (error) {
    console.error('Error sending worker command:', error);
    alert('Failed to send command: ' + error.message);
  } finally {
    // Re-enable submit button
    const submitButton = document.querySelector('#workerCommandModal .btn-primary');
    submitButton.disabled = false;
    submitButton.innerHTML = 'Send Command';
  }
}

// View request details in modal
async function viewRequestDetails(requestId) {
  try {
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('requestDetailsModal'));
    modal.show();
    
    // Show loading state
    document.getElementById('request-details-content').innerHTML = `
      <div class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `;
    
    // Fetch request details
    const response = await fetch(`/api/monitoring/requests/${requestId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch request details');
    }
    
    const data = await response.json();
    
    // Format request details
    const request = data.request;
    const finalResponse = data.responses.find(r => r.is_final);
    
    let html = `
      <div class="request-details-section">
        <h6>Request Information</h6>
        <div class="row">
          <div class="col-md-6">
            <div class="metric-item">
              <span class="metric-label">Request ID:</span>
              <span class="metric-value">${request.request_id}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Type:</span>
              <span class="metric-value">${request.request_type}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Model:</span>
              <span class="metric-value">${request.model}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Timestamp:</span>
              <span class="metric-value">${formatDate(request.timestamp)}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="metric-item">
              <span class="metric-label">User ID:</span>
              <span class="metric-value">${request.user_id || 'N/A'}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Source ID:</span>
              <span class="metric-value">${request.source_id}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Options:</span>
              <span class="metric-value">${formatOptions(request.options)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="request-details-section">
        <h6>Prompt</h6>
        <div class="prompt-text">${escapeHtml(request.prompt || 'N/A')}</div>
      </div>
    `;
    
    if (finalResponse) {
      html += `
        <div class="request-details-section">
          <h6>Metrics</h6>
          <div class="row">
            <div class="col-md-4">
              <div class="metric-item">
                <span class="metric-label">Processing Time:</span>
                <span class="metric-value">${formatTime(finalResponse.processing_time)}</span>
              </div>
            </div>
            <div class="col-md-4">
              <div class="metric-item">
                <span class="metric-label">Total Tokens:</span>
                <span class="metric-value">${finalResponse.total_tokens || 'N/A'}</span>
              </div>
            </div>
            <div class="col-md-4">
              <div class="metric-item">
                <span class="metric-label">Tokens/Second:</span>
                <span class="metric-value">${finalResponse.tokens_per_second ? Math.round(finalResponse.tokens_per_second * 10) / 10 : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    html += `
      <div class="request-details-section">
        <h6>Response</h6>
        <div class="response-text">${getResponseText(data.responses)}</div>
      </div>
    `;
    
    document.getElementById('request-details-content').innerHTML = html;
    
  } catch (error) {
    console.error('Error loading request details:', error);
    document.getElementById('request-details-content').innerHTML = `
      <div class="alert alert-danger">
        Failed to load request details. Please try again later.
      </div>
    `;
  }
}

// Helper function to get full response text from response chunks
function getResponseText(responses) {
  // First check if final response has complete content
  const finalResponse = responses.find(r => r.is_final);
  if (finalResponse) {
    // Check if token contains the full response
    if (finalResponse.token) {
      return escapeHtml(finalResponse.token);
    } 
    // Check if metadata contains the full response
    else if (finalResponse.metadata && finalResponse.metadata.fullResponse) {
      // Check if it's an object containing a response property
      if (typeof finalResponse.metadata.fullResponse === 'object' && finalResponse.metadata.fullResponse.response) {
        return escapeHtml(finalResponse.metadata.fullResponse.response);
      }
      // Otherwise use the fullResponse directly if it's a string
      else if (typeof finalResponse.metadata.fullResponse === 'string') {
        return escapeHtml(finalResponse.metadata.fullResponse);
      }
    }
  }
  
  // If we couldn't find the complete response in the final message,
  // concatenate all token messages to rebuild the full response
  const tokens = responses
    .filter(r => r.token && r.response_type === 'token')
    .map(r => r.token)
    .join('');
  
  return escapeHtml(tokens || 'No response content available');
}

// Format date to a readable string
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Format options object to a readable string
function formatOptions(options) {
  if (!options) return 'None';
  
  try {
    // If options is a string (JSON), parse it
    const optionsObj = typeof options === 'string' ? JSON.parse(options) : options;
    
    // Return a shortened representation of keys
    const keys = Object.keys(optionsObj);
    if (keys.length === 0) return 'None';
    
    if (keys.length <= 3) {
      return keys.join(', ');
    } else {
      return `${keys.slice(0, 3).join(', ')}... (${keys.length} total)`;
    }
  } catch (e) {
    return 'Invalid format';
  }
}

// Show error alert
function showErrorAlert(message) {
  // This would typically show a Bootstrap alert
  console.error(message);
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Load models from API
async function loadModels() {
  try {
    const response = await fetch('/api/admin/models');
    
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    
    const data = await response.json();
    
    const tableBody = document.getElementById('models-list');
    
    if (!data.models || data.models.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No models found. Try syncing models first.</td></tr>';
      return;
    }
    
    let html = '';
    
    data.models.forEach(model => {
      // Determine status badge
      let statusBadge = '';
      if (model.status) {
        if (model.status.enabled && model.status.available) {
          statusBadge = '<span class="badge bg-success">Enabled & Available</span>';
        } else if (model.status.enabled) {
          statusBadge = '<span class="badge bg-warning">Enabled (Unavailable)</span>';
        } else if (model.status.available) {
          statusBadge = '<span class="badge bg-info">Available (Disabled)</span>';
        } else {
          statusBadge = '<span class="badge bg-secondary">Disabled</span>';
        }
      } else {
        statusBadge = '<span class="badge bg-secondary">Unknown</span>';
      }
      
      // Format description
      const description = model.description ? 
        (model.description.length > 50 ? model.description.substring(0, 50) + '...' : model.description) : 
        'No description';
      
      html += `
        <tr>
          <td>${model.id}</td>
          <td>${model.provider}</td>
          <td>${model.name}</td>
          <td class="truncate">${description}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-sm btn-primary me-1" onclick="viewModelDetails('${model.id}')">
              <i class="bi bi-info-circle"></i> Details
            </button>
            ${model.status && !model.status.enabled ? 
              `<button class="btn btn-sm btn-success" onclick="updateModelStatus('${model.id}', true)">
                <i class="bi bi-play-fill"></i> Enable
              </button>` : 
              `<button class="btn btn-sm btn-danger" onclick="updateModelStatus('${model.id}', false)">
                <i class="bi bi-stop-fill"></i> Disable
              </button>`
            }
          </td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading models:', error);
    const tableBody = document.getElementById('models-list');
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load models. Database may not be initialized.</td></tr>';
  }
}

// Refresh models list
function refreshModels() {
  loadModels();
}

// View model details
async function viewModelDetails(modelId) {
  try {
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('modelDetailsModal'));
    modal.show();
    
    // Show loading state
    document.getElementById('model-details-content').innerHTML = `
      <div class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `;
    
    // Fetch model details
    const response = await fetch(`/api/admin/models/${modelId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch model details');
    }
    
    const data = await response.json();
    
    // Format model details
    const model = data.model;
    
    const html = `
      <div class="model-details-section">
        <h6>Basic Information</h6>
        <div class="row">
          <div class="col-md-6">
            <div class="metric-item">
              <span class="metric-label">Model ID:</span>
              <span class="metric-value">${model.id}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Name:</span>
              <span class="metric-value">${model.name}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Provider:</span>
              <span class="metric-value">${model.provider}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="metric-item">
              <span class="metric-label">Status:</span>
              <span class="metric-value">
                ${model.status.enabled ? 
                  '<span class="badge bg-success">Enabled</span>' : 
                  '<span class="badge bg-danger">Disabled</span>'
                }
                ${model.status.available ? 
                  '<span class="badge bg-info">Available</span>' : 
                  '<span class="badge bg-warning">Unavailable</span>'
                }
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Last Updated:</span>
              <span class="metric-value">${formatDate(model.status.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="model-details-section">
        <h6>Description</h6>
        <p>${model.description || 'No description available'}</p>
      </div>
      
      ${model.capabilities && Object.keys(model.capabilities).length > 0 ? `
        <div class="model-details-section">
          <h6>Capabilities</h6>
          <div class="row">
            ${Object.entries(model.capabilities).map(([key, value]) => `
              <div class="col-md-4">
                <div class="metric-item">
                  <span class="metric-label">${key}:</span>
                  <span class="metric-value">${value === true ? '✅' : value === false ? '❌' : value}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${model.parameters && Object.keys(model.parameters).length > 0 ? `
        <div class="model-details-section">
          <h6>Default Parameters</h6>
          <div class="row">
            ${Object.entries(model.parameters).map(([key, value]) => `
              <div class="col-md-4">
                <div class="metric-item">
                  <span class="metric-label">${key}:</span>
                  <span class="metric-value">${typeof value === 'object' ? JSON.stringify(value) : value}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${model.metadata && Object.keys(model.metadata).length > 0 ? `
        <div class="model-details-section">
          <h6>Metadata</h6>
          <div class="row">
            ${Object.entries(model.metadata).map(([key, value]) => `
              <div class="col-md-4">
                <div class="metric-item">
                  <span class="metric-label">${key}:</span>
                  <span class="metric-value">${typeof value === 'object' ? JSON.stringify(value) : value}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="d-flex justify-content-end mt-3">
        ${model.status && !model.status.enabled ? 
          `<button class="btn btn-success me-2" onclick="updateModelStatus('${model.id}', true)">
            <i class="bi bi-play-fill"></i> Enable Model
          </button>` : 
          `<button class="btn btn-danger me-2" onclick="updateModelStatus('${model.id}', false)">
            <i class="bi bi-stop-fill"></i> Disable Model
          </button>`
        }
      </div>
    `;
    
    document.getElementById('model-details-content').innerHTML = html;
    
  } catch (error) {
    console.error('Error loading model details:', error);
    document.getElementById('model-details-content').innerHTML = `
      <div class="alert alert-danger">
        Failed to load model details. Please try again later.
      </div>
    `;
  }
}

// Update model status (enable/disable)
async function updateModelStatus(modelId, enable) {
  try {
    // Confirm with user
    if (!confirm(`Are you sure you want to ${enable ? 'enable' : 'disable'} this model?`)) {
      return;
    }
    
    // Send update
    const response = await fetch(`/api/admin/models/${modelId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: {
          enabled: enable
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update model status');
    }
    
    const data = await response.json();
    
    // Show success message
    alert(`Model ${enable ? 'enabled' : 'disabled'} successfully`);
    
    // Refresh models list
    loadModels();
    
    // If modal is open, close it
    const modalElement = document.getElementById('modelDetailsModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
      modalInstance.hide();
    }
    
  } catch (error) {
    console.error('Error updating model status:', error);
    alert('Failed to update model status: ' + error.message);
  }
}

// Sync models with provider(s)
async function syncModels() {
  try {
    // Confirm with user
    if (!confirm('This will sync models from all providers. Continue?')) {
      return;
    }
    
    // Change button to loading state
    const syncButton = document.querySelector('#models-section .btn-secondary');
    syncButton.disabled = true;
    syncButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Syncing...';
    
    // Send sync request
    const response = await fetch('/api/admin/models/sync', {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync models');
    }
    
    const data = await response.json();
    
    // Show success message
    alert('Models synced successfully');
    
    // Refresh models list
    loadModels();
    
  } catch (error) {
    console.error('Error syncing models:', error);
    alert('Failed to sync models: ' + error.message);
  } finally {
    // Reset button
    const syncButton = document.querySelector('#models-section .btn-secondary');
    syncButton.disabled = false;
    syncButton.innerHTML = '<i class="bi bi-cloud-download"></i> Sync Models';
  }
}
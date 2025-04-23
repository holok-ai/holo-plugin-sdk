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
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No worker data found</td></tr>';
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
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading worker performance:', error);
    showErrorAlert('Failed to load worker performance data. Please try again later.');
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
  // For now, just show the final response or last token
  const finalResponse = responses.find(r => r.is_final);
  if (finalResponse) {
    if (finalResponse.token) {
      return escapeHtml(finalResponse.token);
    } else if (finalResponse.metadata && finalResponse.metadata.fullResponse) {
      return escapeHtml(finalResponse.metadata.fullResponse);
    }
  }
  
  // If no final response, concatenate tokens
  const tokens = responses
    .filter(r => r.token)
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
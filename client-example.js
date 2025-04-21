const fetch = require('node-fetch');

/**
 * A simple client to test the LLM Proxy API
 */
async function streamingRequest() {
  try {
    console.log('Sending streaming request to LLM Proxy...');
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mock-llama2-7b',
        prompt: 'Explain how a distributed message queue works.'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { value, done } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Decode the chunk
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE messages
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // Keep the last (possibly incomplete) line in the buffer
      
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const jsonStr = line.slice(5).trim();
          
          if (jsonStr === '[DONE]') {
            console.log('\nStream completed.');
            break;
          }
          
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'token') {
              process.stdout.write(data.token);
            }
          } catch (e) {
            console.error(`Error parsing JSON: ${e.message}`);
          }
        }
      }
    }
    
    console.log('\nRequest completed!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run the example
streamingRequest();

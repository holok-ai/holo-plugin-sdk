# OpenAI Streaming Usage Statistics Missing

## Issue
The OpenAI client is configured with `stream_options: { include_usage: true }` but the final chunk containing usage statistics is not appearing in the stream. This means we're missing token usage data for OpenAI streaming responses.

## Expected Behavior
According to OpenAI's API documentation, when `stream_options.include_usage` is set to `true`, the final chunk in the stream should contain a `usage` object with:
- `prompt_tokens`: Number of tokens in the prompt
- `completion_tokens`: Number of tokens in the completion
- `total_tokens`: Total number of tokens used

## Current Status
- ✅ Request is being sent with correct `stream_options: { include_usage: true }`
- ❌ Final chunk with usage statistics is not received in the stream
- ❌ Missing token usage data for cost calculation and metrics

## Investigation Steps Needed

1. **Verify OpenAI Client Configuration**:
   - Check if the OpenAI SDK version supports `stream_options.include_usage`
   - Verify the request payload being sent to OpenAI API
   - Confirm the stream options are correctly formatted

2. **Debug Stream Processing**:
   - Add logging to capture all chunks received from OpenAI
   - Look for the final chunk with `finish_reason` and `usage` object
   - Check if the usage chunk is being filtered out or not processed

3. **Check API Version Compatibility**:
   - Ensure we're using a compatible API version that supports usage in streaming
   - Some OpenAI API versions may not support usage statistics in streaming mode

4. **Verify Request Format**:
   ```typescript
   const streamOptions = {
     stream: true,
     stream_options: {
       include_usage: true  // Ensure this is exactly correct
     }
   };
   ```

## Potential Causes

1. **SDK Version Issue**: Older versions of the OpenAI SDK might not support this feature
2. **API Version**: The API version being used might not support usage in streaming
3. **Request Format**: The `stream_options` might not be formatted correctly
4. **Stream Processing**: The usage chunk might be received but not processed correctly
5. **OpenAI API Limitation**: Some models or configurations might not support streaming usage

## Files to Investigate

- `src/providers/openai.provider.ts` - Check streaming implementation
- OpenAI request configuration and payload logging
- Stream chunk processing logic
- OpenAI SDK version in `package.json`

## Impact

Without usage statistics from streaming responses:
- ❌ Cannot calculate accurate costs for OpenAI streaming requests
- ❌ Missing token metrics for performance monitoring  
- ❌ Incomplete audit trail for token usage
- ❌ May affect billing and usage analytics

## Priority
**High** - This affects cost calculation and usage metrics for all OpenAI streaming requests.

## References
- [OpenAI API Documentation - Streaming](https://platform.openai.com/docs/api-reference/chat/create#chat-create-stream_options)
- [OpenAI Cookbook - Streaming with Usage](https://cookbook.openai.com/examples/how_to_stream_completions)

## Test Plan
1. Create a test OpenAI streaming request with `include_usage: true`
2. Log all received chunks to identify if usage chunk is present
3. Verify the usage data format matches expected structure
4. Test with different models to see if it's model-specific
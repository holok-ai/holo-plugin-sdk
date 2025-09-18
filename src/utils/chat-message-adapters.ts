// Sample Usage
/* 
  const canonical: CanonicalMessage = {
    system_prompt: "You are a helpful assistant.",
    user_prompt: "Summarize the latest AI trends.",
    temperature: 0.6,
    top_p: 0.95,
    max_tokens: 150,
    stop_sequences: ["\n"],
    model: "pplx-7b-chat",
    stream: true
};

const adapter = ChatAdapterFactory.createAdapter(Provider.PERPLEXITY, canonical
console.log(adapter.toProviderFormat()); 
*/


export interface CanonicalMessage {
  system_prompt: string;
  user_prompt: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  stop_sequences: string[];
  model: string;
  stream: boolean;
  metadata?: Record<string, any>;
  context?: string;
}

export enum Provider {
  ANTHROPIC = "ANTHROPIC",
  OPENAI = "OPENAI",
  OLLAMA = "OLLAMA",
  PERPLEXITY = "PERPLEXITY"
}

export class ChatAdapterFactory {
  static createAdapter(provider: Provider, data: CanonicalMessage): ChatMessageAdapter {
    switch (provider) {
      case Provider.ANTHROPIC:
        return new AnthropicAdapter(data);
      case Provider.OPENAI:
        return new OpenAIAdapter(data);
      case Provider.OLLAMA:
        return new OllamaAdapter(data);
      case Provider.PERPLEXITY:
        return new PerplexityAdapter(data);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}


export abstract class ChatMessageAdapter {
  protected data: CanonicalMessage;

  constructor(data: CanonicalMessage) {
    this.data = data;
  }

  static fieldMap: Record<string, (data: CanonicalMessage) => any>;

  abstract toProviderFormat(): Record<string, any>;
}

export class PerplexityAdapter extends ChatMessageAdapter {
  static fieldMap = {
    system_prompt: (data: CanonicalMessage) => ({
      messages: [{ role: "system", content: data.system_prompt }]
    }),
    user_prompt: (data: CanonicalMessage) => ({
      messages: [{ role: "user", content: data.user_prompt }]
    }),
    temperature: (data: CanonicalMessage) => ({ temperature: data.temperature }),
    top_p: (data: CanonicalMessage) => ({ top_p: data.top_p }),
    max_tokens: (data: CanonicalMessage) => ({ max_tokens: data.max_tokens }),
    stop_sequences: (data: CanonicalMessage) => ({ stop: data.stop_sequences }),
    model: (data : CanonicalMessage) => ({ model: data.model }),
    stream: (data : CanonicalMessage) => ({ stream: data.stream }),
    metadata: (data : CanonicalMessage) => ({ metadata: data.metadata }),
    context: (data : CanonicalMessage) => ({ context: data.context })
  };

  override toProviderFormat(): Record<string, any> {
    return Object.entries(PerplexityAdapter.fieldMap).reduce((acc, [_key, fn]) => {
      return { ...acc, ...fn(this.data) };
    }, {});
  }
}

export class OllamaAdapter extends ChatMessageAdapter {
  static fieldMap = {
    system_prompt: (data: CanonicalMessage) => ({
      messages: [{ role: 'system', content: data.system_prompt }]
    }),
    user_prompt: (data : CanonicalMessage) => ({ messages: [{ role: 'user', content: data.user_prompt }] }),
    temperature: (data : CanonicalMessage) => ({ temperature: data.temperature }),
    top_p: (data : CanonicalMessage) => ({ top_p: data.top_p }),
    max_tokens: (data : CanonicalMessage) => ({ max_tokens: data.max_tokens }),
    stop_sequences: (data : CanonicalMessage) => ({ stop: data.stop_sequences }),
    model: (data : CanonicalMessage) => ({ model: data.model }),
    stream: (data : CanonicalMessage) => ({ stream: data.stream }),
    metadata: (data : CanonicalMessage) => ({ metadata: data.metadata }),
    context: (data : CanonicalMessage) => ({ context: data.context })
  };

  override toProviderFormat(): Record<string, any> {
    return Object.entries(OllamaAdapter.fieldMap).reduce((acc, [_key, fn]) => {
      return { ...acc, ...fn(this.data) };
    }, {});
  }
}

export class AnthropicAdapter extends ChatMessageAdapter {
  static fieldMap = {
    system_prompt: (data : CanonicalMessage) => ({ system: data.system_prompt }),
    user_prompt: (data : CanonicalMessage) => ({ prompt: data.user_prompt }),
    temperature: (data : CanonicalMessage) => ({ temperature: data.temperature }),
    top_p: (data : CanonicalMessage) => ({ top_p: data.top_p }),
    max_tokens: (data : CanonicalMessage) => ({ max_tokens: data.max_tokens }),
    stop_sequences: (data : CanonicalMessage) => ({ stop_sequences: data.stop_sequences }),
    model: (data : CanonicalMessage) => ({ model: data.model }),
    stream: (data : CanonicalMessage) => ({ stream: data.stream }),
    metadata: (data : CanonicalMessage) => ({ metadata: data.metadata }),
    context: (data : CanonicalMessage) => ({ context: data.context })
  };

  override toProviderFormat(): Record<string, any> {
    return Object.entries(AnthropicAdapter.fieldMap).reduce((acc, [_key, fn]) => {
      return { ...acc, ...fn(this.data) };
    }, {});
  }
}

export class OpenAIAdapter extends ChatMessageAdapter {
  static fieldMap = {
    system_prompt: (data : CanonicalMessage) => ({
      messages: [{ role: 'system', content: data.system_prompt }]
    }),
    user_prompt: (data : CanonicalMessage) => ({
      messages: [{ role: 'user', content: data.user_prompt }]
    }),
    temperature: (data : CanonicalMessage) => ({ temperature: data.temperature }),
    top_p: (data : CanonicalMessage) => ({ top_p: data.top_p }),
    max_tokens: (data : CanonicalMessage) => ({ max_tokens: data.max_tokens }),
    stop_sequences: (data : CanonicalMessage) => ({ stop: data.stop_sequences }),
    model: (data : CanonicalMessage) => ({ model: data.model }),
    stream: (data : CanonicalMessage) => ({ stream: data.stream }),
    metadata: (data : CanonicalMessage) => ({ metadata: data.metadata }),
    context: (data : CanonicalMessage) => ({ context: data.context })
  };

  override toProviderFormat(): Record<string, any> {
    return Object.entries(OpenAIAdapter.fieldMap).reduce((acc, [_key, fn]) => {
      return { ...acc, ...fn(this.data) };
    }, {});
  }
}

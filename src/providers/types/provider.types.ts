export interface AIProviderConfig {
    baseUrl?: string
    apiKey?: string
    auditEnabled: boolean
}

export interface OllamaProviderConfig extends AIProviderConfig {
    host: string,
    timeout: number
}




// Request type enum
export enum RequestType {
    GENERATE = 'generate',
    CHAT = 'chat',
    RESPONSES = 'responses'
}

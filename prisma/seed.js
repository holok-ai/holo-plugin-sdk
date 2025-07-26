// prisma/seed.js
const {PrismaClient} = require('../src/generated/prisma')
const prisma = new PrismaClient()

async function main() {
    // Create seed data for providers
    const openaiProvider = await prisma.providers.upsert({
        where: {id: 'openai'},
        update: {},
        create: {
            id: 'openai',
            name: 'OpenAI',
            description: 'OpenAI API provider for GPT models',
            config: {},
            status: {enabled: true},
            active: true,
            last_active_at: new Date()
        },
    })

    const claudeProvider = await prisma.providers.upsert({
        where: {id: 'claude'},
        update: {},
        create: {
            id: 'claude',
            name: 'Anthropic Claude',
            description: 'Anthropic API provider for Claude models',
            config: {},
            status: {enabled: true},
            active: true,
            last_active_at: new Date()
        },
    })

    const ollamaProvider = await prisma.providers.upsert({
        where: {id: 'ollama'},
        update: {},
        create: {
            id: 'ollama',
            name: 'Ollama',
            description: 'Local LLM provider using Ollama',
            config: {},
            status: {enabled: true},
            active: true,
            last_active_at: new Date()
        },
    })

    const mockProvider = await prisma.providers.upsert({
        where: {id: 'mock'},
        update: {},
        create: {
            id: 'mock',
            name: 'Mock AiProvider',
            description: 'Mock provider for testing',
            config: {},
            status: {enabled: true},
            active: true,
            last_active_at: new Date()
        },
    })

    // Create seed data for models
    const gpt4Model = await prisma.models.upsert({
        where: {id: 'gpt-4'},
        update: {},
        create: {
            id: 'gpt-4',
            name: 'GPT-4',
            description: 'OpenAI GPT-4 model',
            capabilities: {chat: true, completion: true},
            parameters: {},
            status: {enabled: true, available: true}
        },
    })

    const gpt35Model = await prisma.models.upsert({
        where: {id: 'gpt-3.5-turbo'},
        update: {},
        create: {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            description: 'OpenAI GPT-3.5 Turbo model',
            capabilities: {chat: true, completion: true},
            parameters: {},
            status: {enabled: true, available: true}
        },
    })

    const claude3Model = await prisma.models.upsert({
        where: {id: 'claude-3-opus'},
        update: {},
        create: {
            id: 'claude-3-opus',
            name: 'Claude 3 Opus',
            description: 'Anthropic Claude 3 Opus model',
            capabilities: {chat: true, completion: true},
            parameters: {},
            status: {enabled: true, available: true}
        },
    })

    const llamaModel = await prisma.models.upsert({
        where: {id: 'llama3'},
        update: {},
        create: {
            id: 'llama3',
            name: 'Llama 3',
            description: 'Meta Llama 3 model',
            capabilities: {chat: true, completion: true},
            parameters: {},
            status: {enabled: true, available: true}
        },
    })

    // Adding mock models from mock-provider.js
    const mockLlama2Model = await prisma.models.upsert({
        where: {id: 'mock-llama2-7b'},
        update: {},
        create: {
            id: 'mock-llama2-7b',
            name: 'Llama 2 7B',
            description: 'Mock Llama 2 7B model for testing',
            capabilities: {chat: true, completion: true},
            parameters: {tokenRate: 20},
            status: {enabled: true, available: true}
        },
    })

    const mockMistralModel = await prisma.models.upsert({
        where: {id: 'mock-mistral-7b'},
        update: {},
        create: {
            id: 'mock-mistral-7b',
            name: 'Mistral 7B',
            description: 'Mock Mistral 7B model for testing',
            capabilities: {chat: true, completion: true},
            parameters: {tokenRate: 25},
            status: {enabled: true, available: true}
        },
    })

    // Create relationships between providers and models with active flag and last_active_at
    await prisma.provider_models.upsert({
        where: {provider_id_model_id: {provider_id: 'openai', model_id: 'gpt-4'}},
        update: {},
        create: {
            provider_id: 'openai',
            model_id: 'gpt-4',
            config: {},
            status: {enabled: true},
            active: true,
            last_active_at: new Date()
        },
    })

    await prisma.provider_models.upsert({
        where: {provider_id_model_id: {provider_id: 'openai', model_id: 'gpt-3.5-turbo'}},
        update: {},
        create: {
            provider_id: 'openai',
            model_id: 'gpt-3.5-turbo',
            config: {},
            status: {enabled: true},
            active: true,
            last_active_at: new Date()
        },
    })

    await prisma.provider_models.upsert({
        where: {provider_id_model_id: {provider_id: 'claude', model_id: 'claude-3-opus'}},
        update: {},
        create: {
            provider_id: 'claude',
            model_id: 'claude-3-opus',
            config: {},
            status: {enabled: true},
            active: true,
            last_active_at: new Date()
        },
    })

    await prisma.provider_models.upsert({
        where: {provider_id_model_id: {provider_id: 'ollama', model_id: 'llama3'}},
        update: {},
        create: {
            provider_id: 'ollama',
            model_id: 'llama3',
            config: {},
            status: {enabled: true},
            active: true,
            last_active_at: new Date()
        },
    })

    // Add the mock provider models
    await prisma.provider_models.upsert({
        where: {provider_id_model_id: {provider_id: 'mock', model_id: 'mock-llama2-7b'}},
        update: {},
        create: {
            provider_id: 'mock',
            model_id: 'mock-llama2-7b',
            config: {},
            status: {enabled: true},
            active: true,
            last_active_at: new Date()
        },
    })

    await prisma.provider_models.upsert({
        where: {provider_id_model_id: {provider_id: 'mock', model_id: 'mock-mistral-7b'}},
        update: {},
        create: {
            provider_id: 'mock',
            model_id: 'mock-mistral-7b',
            config: {},
            status: {enabled: true},
            active: true,
            last_active_at: new Date()
        },
    })

    console.log('Database has been seeded.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

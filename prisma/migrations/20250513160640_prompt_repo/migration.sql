-- CreateTable
CREATE TABLE "prompt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT NOT NULL,
    "prompt_type" TEXT NOT NULL,
    "system_prompt" TEXT,
    "user_prompt" TEXT NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "temperature" DOUBLE PRECISION,
    "top_p" DOUBLE PRECISION,
    "top_k" INTEGER,
    "max_tokens" INTEGER,
    "presence_penalty" DOUBLE PRECISION,
    "frequency_penalty" DOUBLE PRECISION,
    "stop_sequences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "model" TEXT,
    "anthropic_version" TEXT,
    "safety_settings" JSONB,
    "grok_settings" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" TEXT NOT NULL DEFAULT '1.0',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prompt_provider_prompt_type_idx" ON "prompt"("provider", "prompt_type");

-- CreateIndex
CREATE INDEX "prompt_name_idx" ON "prompt"("name");

-- CreateIndex
CREATE INDEX "prompt_tags_idx" ON "prompt"("tags");

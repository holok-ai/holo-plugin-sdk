-- CreateTable
CREATE TABLE "llm_request_audit" (
    "id" SERIAL NOT NULL,
    "request_id" VARCHAR(36) NOT NULL,
    "request_type" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "prompt" TEXT,
    "options" JSONB,
    "source_id" VARCHAR(100),
    "user_id" VARCHAR(100),
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "llm_request_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_response_audit" (
    "id" SERIAL NOT NULL,
    "request_id" VARCHAR(36) NOT NULL,
    "response_type" VARCHAR(50) NOT NULL,
    "token" TEXT,
    "model" VARCHAR(100),
    "worker_id" VARCHAR(100),
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_final" BOOLEAN DEFAULT false,
    "total_tokens" INTEGER,
    "processing_time" INTEGER,
    "tokens_per_second" DOUBLE PRECISION,
    "metadata" JSONB,

    CONSTRAINT "llm_response_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "models" (
    "id" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "capabilities" JSONB NOT NULL DEFAULT '{}',
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" JSONB NOT NULL DEFAULT '{"enabled": false, "available": false}',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_response_request_id" ON "llm_response_audit"("request_id");

-- CreateIndex
CREATE INDEX "idx_models_provider" ON "models"("provider");

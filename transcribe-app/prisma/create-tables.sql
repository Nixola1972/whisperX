-- WhisperX Transcription App - Database Schema
-- Generated from Prisma schema for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    "fullName" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL,
    "stripeCustomerId" VARCHAR(255) UNIQUE NOT NULL,
    "stripeSubscriptionId" VARCHAR(255) UNIQUE,
    "stripePriceId" VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    "billingCycle" VARCHAR(50) NOT NULL,
    "currentPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
    "currentPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS subscriptions_userId_idx ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS subscriptions_stripeCustomerId_idx ON subscriptions("stripeCustomerId");

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "fileName" VARCHAR(500) NOT NULL,
    "filePath" VARCHAR(1000) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    "errorMessage" TEXT,
    "transcriptText" TEXT,
    language VARCHAR(50),
    "durationSeconds" INTEGER,
    segments JSONB,
    speakers JSONB,
    "geminiDocumentId" VARCHAR(255) UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "processedAt" TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS transcripts_userId_createdAt_idx ON transcripts("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS transcripts_status_idx ON transcripts(status);

-- AI Summaries table
CREATE TABLE IF NOT EXISTS ai_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "transcriptId" UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("transcriptId") REFERENCES transcripts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ai_summaries_transcriptId_idx ON ai_summaries("transcriptId");

-- File Search Stores table (Gemini integration)
CREATE TABLE IF NOT EXISTS file_search_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL,
    "geminiStoreName" VARCHAR(500) UNIQUE NOT NULL,
    "totalSizeMb" DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    "documentCount" INTEGER DEFAULT 0 NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- API Keys table (for MCP server)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    scopes TEXT[] NOT NULL,
    "lastUsedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "revokedAt" TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS api_keys_userId_idx ON api_keys("userId");
CREATE INDEX IF NOT EXISTS api_keys_key_idx ON api_keys(key);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL,
    "periodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
    "periodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
    "transcriptionHoursMonth" DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    "transcriptionHoursToday" DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    "lastTranscriptDate" TIMESTAMP WITH TIME ZONE,
    "aiSummariesMonth" INTEGER DEFAULT 0 NOT NULL,
    "aiQuestionsMonth" INTEGER DEFAULT 0 NOT NULL,
    "aiInsightsMonth" INTEGER DEFAULT 0 NOT NULL,
    "estimatedCostMonth" DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Usage Warnings table
CREATE TABLE IF NOT EXISTS usage_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    level VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS usage_warnings_userId_createdAt_idx ON usage_warnings("userId", "createdAt" DESC);

-- Webhook Events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false NOT NULL,
    error TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "processedAt" TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS webhook_events_type_processed_idx ON webhook_events(type, processed);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON transcripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_search_stores_updated_at BEFORE UPDATE ON file_search_stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_updated_at BEFORE UPDATE ON usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the chat_histories table
CREATE TABLE IF NOT EXISTS chat_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    mode TEXT NOT NULL DEFAULT 'general',
    collection_id UUID REFERENCES collections(id),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_chat_histories_user_id ON chat_histories(user_id);
CREATE INDEX idx_chat_histories_collection_id ON chat_histories(collection_id);
CREATE INDEX idx_collections_user_id ON collections(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_histories ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view their own collections"
    ON collections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
    ON collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
    ON collections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
    ON collections FOR DELETE
    USING (auth.uid() = user_id);

-- Chat histories policies
CREATE POLICY "Users can view their own chat histories"
    ON chat_histories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat histories"
    ON chat_histories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat histories"
    ON chat_histories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat histories"
    ON chat_histories FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_histories_updated_at
    BEFORE UPDATE ON chat_histories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
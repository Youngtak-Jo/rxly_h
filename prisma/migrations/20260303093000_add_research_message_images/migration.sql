ALTER TABLE "research_messages"
ADD COLUMN "image_urls" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "storage_paths" JSONB NOT NULL DEFAULT '[]';

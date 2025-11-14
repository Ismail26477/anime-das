-- Add language column to episodes table
ALTER TABLE episodes ADD COLUMN language text DEFAULT 'Japanese';

-- Create index for faster language-based queries
CREATE INDEX idx_episodes_language ON episodes(language);

-- Add comment to column for documentation
COMMENT ON COLUMN episodes.language IS 'Supported languages: Hindi, English, Japanese, Korean, Chinese (Simplified), Chinese (Traditional), Spanish, French, German, Portuguese, Russian, Arabic';

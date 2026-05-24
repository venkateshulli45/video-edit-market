-- Google OAuth: optional password, unique Google subject id
-- Uses video_editor schema (matches DATABASE_URL ?schema=video_editor)

ALTER TABLE video_editor.users
    ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE video_editor.users
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_key
    ON video_editor.users (google_id)
    WHERE google_id IS NOT NULL;

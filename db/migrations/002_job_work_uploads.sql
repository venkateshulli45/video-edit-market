-- Editor work uploads (images/videos) visible on assigned job posts
CREATE TABLE IF NOT EXISTS job_work_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    file_url VARCHAR(512) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER CHECK (file_size >= 0),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_job_work_uploads_job_id ON job_work_uploads(job_id);
CREATE INDEX IF NOT EXISTS idx_job_work_uploads_contract_id ON job_work_uploads(contract_id);

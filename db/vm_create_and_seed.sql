-- =============================================================================
-- Video Edit Marketplace — vm_* schema + seed (PostgreSQL / pgAdmin)
-- =============================================================================
-- How to run in pgAdmin:
--   1. Connect to your database
--   2. Open Query Tool
--   3. Run this entire file
--
-- Creates schema `vem` (not public). All tables live at vem.vm_*.
-- Set DATABASE_URL query param to ?schema=vem so Prisma uses this schema.
--
-- Demo logins (bcrypt hashes below):
--   admin@videoeditmarket.com     / admin123
--   client.alex@example.com       / password123
--   client.sarah@example.com      / password123
--   client.michael@example.com    / password123
--   client.priya@example.com      / password123
--   editor.bob@example.com        / password123
--   editor.charlie@example.com    / password123
--   editor.emma@example.com       / password123
--   editor.liam@example.com       / password123
--   editor.pending@example.com    / password123   (PROVIDER role still pending)
--
-- Timestamps use NOW() so dates are current when you run the script.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS vem;
SET search_path TO vem;

CREATE OR REPLACE FUNCTION vem.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- DROP (safe re-run). Comment this block out if you only want INSERT.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS
  vem.vm_notifications,
  vem.vm_messages,
  vem.vm_chat_members,
  vem.vm_chat_rooms,
  vem.vm_reviews,
  vem.vm_disputes,
  vem.vm_transactions,
  vem.vm_revisions,
  vem.vm_deliveries,
  vem.vm_milestones,
  vem.vm_job_work_uploads,
  vem.vm_contracts,
  vem.vm_proposals,
  vem.vm_job_attachments,
  vem.vm_jobs,
  vem.vm_categories,
  vem.vm_provider_profiles,
  vem.vm_client_profiles,
  vem.vm_user_roles,
  vem.vm_roles,
  vem.vm_users
CASCADE;

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

CREATE TABLE vem.vm_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX vm_users_google_id_key
    ON vem.vm_users (google_id)
    WHERE google_id IS NOT NULL;

CREATE TABLE vem.vm_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_user_roles (
    user_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES vem.vm_roles(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'approved' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE vem.vm_client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES vem.vm_users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    avatar_url VARCHAR(512),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_provider_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES vem.vm_users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    avatar_url VARCHAR(512),
    address TEXT,
    bio TEXT,
    skills TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    portfolio_urls TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    hourly_rate NUMERIC(10, 2) CHECK (hourly_rate >= 0),
    average_rating NUMERIC(3, 2) DEFAULT 0.00 NOT NULL CHECK (average_rating BETWEEN 0.00 AND 5.00),
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES vem.vm_categories(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES vem.vm_categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    pricing_model VARCHAR(50) NOT NULL CHECK (pricing_model IN ('fixed', 'hourly', 'negotiable')),
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    deadline TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'posted' NOT NULL CHECK (status IN ('posted', 'assigned', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_job_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vem.vm_jobs(id) ON DELETE CASCADE,
    file_url VARCHAR(512) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER CHECK (file_size >= 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vem.vm_jobs(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE CASCADE,
    bid_amount NUMERIC(12, 2) NOT NULL CHECK (bid_amount >= 0),
    estimated_days INTEGER CHECK (estimated_days > 0),
    proposal_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT vm_unique_job_provider_proposal UNIQUE (job_id, provider_id)
);

CREATE TABLE vem.vm_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vem.vm_jobs(id) ON DELETE RESTRICT,
    proposal_id UUID UNIQUE REFERENCES vem.vm_proposals(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE RESTRICT,
    agreed_price NUMERIC(12, 2) NOT NULL CHECK (agreed_price >= 0),
    status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'submitted', 'revision_requested', 'completed', 'disputed', 'refunded')),
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_job_work_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vem.vm_jobs(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES vem.vm_contracts(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    file_url VARCHAR(512) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER CHECK (file_size >= 0),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES vem.vm_contracts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'funded', 'released', 'disputed')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES vem.vm_contracts(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES vem.vm_milestones(id) ON DELETE SET NULL,
    delivery_text TEXT,
    file_url VARCHAR(512),
    file_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending_review' NOT NULL CHECK (status IN ('pending_review', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES vem.vm_deliveries(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES vem.vm_contracts(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES vem.vm_milestones(id) ON DELETE SET NULL,
    sender_id UUID NOT NULL REFERENCES vem.vm_users(id),
    receiver_id UUID NOT NULL REFERENCES vem.vm_users(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    type VARCHAR(50) NOT NULL CHECK (type IN ('escrow_deposit', 'escrow_release', 'escrow_refund', 'platform_fee')),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    payment_gateway VARCHAR(50) CHECK (payment_gateway IN ('stripe', 'razorpay')),
    reference_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES vem.vm_contracts(id) ON DELETE RESTRICT,
    raised_by_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'resolved_refunded', 'resolved_released', 'resolved_split')),
    resolution_details TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES vem.vm_contracts(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE RESTRICT,
    reviewee_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE RESTRICT,
    rating_quality INTEGER NOT NULL CHECK (rating_quality BETWEEN 1 AND 5),
    rating_communication INTEGER NOT NULL CHECK (rating_communication BETWEEN 1 AND 5),
    rating_timeliness INTEGER NOT NULL CHECK (rating_timeliness BETWEEN 1 AND 5),
    overall_rating NUMERIC(3, 2) NOT NULL CHECK (overall_rating BETWEEN 1.00 AND 5.00),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT vm_unique_contract_reviewer UNIQUE (contract_id, reviewer_id)
);

CREATE TABLE vem.vm_chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES vem.vm_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_chat_members (
    room_id UUID NOT NULL REFERENCES vem.vm_chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE CASCADE,
    PRIMARY KEY (room_id, user_id)
);

CREATE TABLE vem.vm_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES vem.vm_chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE RESTRICT,
    message_text TEXT NOT NULL,
    file_url VARCHAR(512),
    file_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE vem.vm_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES vem.vm_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('job_update', 'proposal_update', 'contract_update', 'message', 'payment', 'system')),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_vm_users_modtime
    BEFORE UPDATE ON vem.vm_users
    FOR EACH ROW EXECUTE FUNCTION vem.update_updated_at_column();

CREATE TRIGGER update_vm_client_profiles_modtime
    BEFORE UPDATE ON vem.vm_client_profiles
    FOR EACH ROW EXECUTE FUNCTION vem.update_updated_at_column();

CREATE TRIGGER update_vm_provider_profiles_modtime
    BEFORE UPDATE ON vem.vm_provider_profiles
    FOR EACH ROW EXECUTE FUNCTION vem.update_updated_at_column();

CREATE TRIGGER update_vm_jobs_modtime
    BEFORE UPDATE ON vem.vm_jobs
    FOR EACH ROW EXECUTE FUNCTION vem.update_updated_at_column();

CREATE TRIGGER update_vm_proposals_modtime
    BEFORE UPDATE ON vem.vm_proposals
    FOR EACH ROW EXECUTE FUNCTION vem.update_updated_at_column();

CREATE TRIGGER update_vm_contracts_modtime
    BEFORE UPDATE ON vem.vm_contracts
    FOR EACH ROW EXECUTE FUNCTION vem.update_updated_at_column();

CREATE TRIGGER update_vm_milestones_modtime
    BEFORE UPDATE ON vem.vm_milestones
    FOR EACH ROW EXECUTE FUNCTION vem.update_updated_at_column();

CREATE TRIGGER update_vm_disputes_modtime
    BEFORE UPDATE ON vem.vm_disputes
    FOR EACH ROW EXECUTE FUNCTION vem.update_updated_at_column();

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_vm_users_email ON vem.vm_users(email);
CREATE INDEX idx_vm_user_roles_user ON vem.vm_user_roles(user_id);
CREATE INDEX idx_vm_user_roles_role ON vem.vm_user_roles(role_id);
CREATE INDEX idx_vm_client_profiles_user ON vem.vm_client_profiles(user_id);
CREATE INDEX idx_vm_provider_profiles_user ON vem.vm_provider_profiles(user_id);
CREATE INDEX idx_vm_categories_parent ON vem.vm_categories(parent_id);
CREATE INDEX idx_vm_jobs_client ON vem.vm_jobs(client_id);
CREATE INDEX idx_vm_jobs_category ON vem.vm_jobs(category_id);
CREATE INDEX idx_vm_jobs_status ON vem.vm_jobs(status);
CREATE INDEX idx_vm_job_attachments_job ON vem.vm_job_attachments(job_id);
CREATE INDEX idx_vm_proposals_job ON vem.vm_proposals(job_id);
CREATE INDEX idx_vm_proposals_provider ON vem.vm_proposals(provider_id);
CREATE INDEX idx_vm_contracts_job ON vem.vm_contracts(job_id);
CREATE INDEX idx_vm_contracts_client ON vem.vm_contracts(client_id);
CREATE INDEX idx_vm_contracts_provider ON vem.vm_contracts(provider_id);
CREATE INDEX idx_vm_contracts_status ON vem.vm_contracts(status);
CREATE INDEX idx_vm_job_work_uploads_job ON vem.vm_job_work_uploads(job_id);
CREATE INDEX idx_vm_job_work_uploads_contract ON vem.vm_job_work_uploads(contract_id);
CREATE INDEX idx_vm_milestones_contract ON vem.vm_milestones(contract_id);
CREATE INDEX idx_vm_deliveries_contract ON vem.vm_deliveries(contract_id);
CREATE INDEX idx_vm_transactions_contract ON vem.vm_transactions(contract_id);
CREATE INDEX idx_vm_transactions_sender ON vem.vm_transactions(sender_id);
CREATE INDEX idx_vm_transactions_receiver ON vem.vm_transactions(receiver_id);
CREATE INDEX idx_vm_disputes_contract ON vem.vm_disputes(contract_id);
CREATE INDEX idx_vm_reviews_reviewee ON vem.vm_reviews(reviewee_id);
CREATE INDEX idx_vm_chat_members_user ON vem.vm_chat_members(user_id);
CREATE INDEX idx_vm_messages_room ON vem.vm_messages(room_id);
CREATE INDEX idx_vm_notifications_user_read ON vem.vm_notifications(user_id, is_read);

-- =============================================================================
-- SEED DATA  (relative to NOW() so it stays current when you run it)
-- =============================================================================

-- Password hashes:
--   admin123     -> $2b$10$3IjRJo3IxPT4CH4/2xic6.Issh1ZfjLhCm6yUJSEM/F6QfyzorC9q
--   password123  -> $2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa

INSERT INTO vem.vm_roles (id, name, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'CLIENT', NOW() - INTERVAL '120 days'),
  ('c0000000-0000-0000-0000-000000000002', 'PROVIDER', NOW() - INTERVAL '120 days'),
  ('c0000000-0000-0000-0000-000000000003', 'ADMIN', NOW() - INTERVAL '120 days');

INSERT INTO vem.vm_users (id, email, password_hash, google_id, is_active, expires_at, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000000', 'admin@videoeditmarket.com', '$2b$10$3IjRJo3IxPT4CH4/2xic6.Issh1ZfjLhCm6yUJSEM/F6QfyzorC9q', NULL, TRUE, NULL, NOW() - INTERVAL '120 days', NOW()),
  ('11111111-1111-1111-1111-111111111101', 'client.alex@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', NULL, TRUE, NULL, NOW() - INTERVAL '90 days', NOW()),
  ('11111111-1111-1111-1111-111111111102', 'client.sarah@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', 'google-oauth-sarah-1093847562', TRUE, NULL, NOW() - INTERVAL '75 days', NOW()),
  ('11111111-1111-1111-1111-111111111103', 'client.michael@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', NULL, TRUE, NULL, NOW() - INTERVAL '60 days', NOW()),
  ('11111111-1111-1111-1111-111111111104', 'client.priya@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', NULL, TRUE, NULL, NOW() - INTERVAL '30 days', NOW()),
  ('22222222-2222-2222-2222-222222222201', 'editor.bob@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', NULL, TRUE, NULL, NOW() - INTERVAL '88 days', NOW()),
  ('22222222-2222-2222-2222-222222222202', 'editor.charlie@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', NULL, TRUE, NULL, NOW() - INTERVAL '70 days', NOW()),
  ('22222222-2222-2222-2222-222222222203', 'editor.emma@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', NULL, TRUE, NULL, NOW() - INTERVAL '55 days', NOW()),
  ('22222222-2222-2222-2222-222222222204', 'editor.liam@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', NULL, TRUE, NULL, NOW() - INTERVAL '20 days', NOW()),
  ('22222222-2222-2222-2222-222222222205', 'editor.pending@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', NULL, TRUE, NULL, NOW() - INTERVAL '2 days', NOW());

INSERT INTO vem.vm_user_roles (user_id, role_id, status, assigned_at, expires_at) VALUES
  ('a0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000003', 'approved', NOW() - INTERVAL '120 days', NULL),
  ('11111111-1111-1111-1111-111111111101', 'c0000000-0000-0000-0000-000000000001', 'approved', NOW() - INTERVAL '90 days', NULL),
  ('11111111-1111-1111-1111-111111111102', 'c0000000-0000-0000-0000-000000000001', 'approved', NOW() - INTERVAL '75 days', NULL),
  ('11111111-1111-1111-1111-111111111103', 'c0000000-0000-0000-0000-000000000001', 'approved', NOW() - INTERVAL '60 days', NULL),
  ('11111111-1111-1111-1111-111111111104', 'c0000000-0000-0000-0000-000000000001', 'approved', NOW() - INTERVAL '30 days', NULL),
  ('22222222-2222-2222-2222-222222222201', 'c0000000-0000-0000-0000-000000000002', 'approved', NOW() - INTERVAL '88 days', NULL),
  ('22222222-2222-2222-2222-222222222202', 'c0000000-0000-0000-0000-000000000002', 'approved', NOW() - INTERVAL '70 days', NULL),
  ('22222222-2222-2222-2222-222222222203', 'c0000000-0000-0000-0000-000000000002', 'approved', NOW() - INTERVAL '55 days', NULL),
  ('22222222-2222-2222-2222-222222222204', 'c0000000-0000-0000-0000-000000000002', 'approved', NOW() - INTERVAL '20 days', NULL),
  ('22222222-2222-2222-2222-222222222205', 'c0000000-0000-0000-0000-000000000002', 'pending', NOW() - INTERVAL '2 days', NULL);

INSERT INTO vem.vm_client_profiles (id, user_id, full_name, phone_number, avatar_url, address, created_at, updated_at) VALUES
  ('11111111-1111-1111-2222-111111111101', '11111111-1111-1111-1111-111111111101', 'Alex Reed', '+1 212-555-0101', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', '412 Hudson St, New York, NY 10014', NOW() - INTERVAL '90 days', NOW()),
  ('11111111-1111-1111-2222-111111111102', '11111111-1111-1111-1111-111111111102', 'Sarah Jenkins', '+1 415-555-0188', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', '88 Market St, San Francisco, CA 94105', NOW() - INTERVAL '75 days', NOW()),
  ('11111111-1111-1111-2222-111111111103', '11111111-1111-1111-1111-111111111103', 'Michael Chang', '+1 312-555-0144', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', '200 N Michigan Ave, Chicago, IL 60601', NOW() - INTERVAL '60 days', NOW()),
  ('11111111-1111-1111-2222-111111111104', '11111111-1111-1111-1111-111111111104', 'Priya Nair', '+1 206-555-0190', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80', '1201 2nd Ave, Seattle, WA 98101', NOW() - INTERVAL '30 days', NOW());

INSERT INTO vem.vm_provider_profiles (id, user_id, full_name, phone_number, avatar_url, address, bio, skills, portfolio_urls, hourly_rate, average_rating, is_available, created_at, updated_at) VALUES
  (
    '22222222-2222-2222-3333-222222222201',
    '22222222-2222-2222-2222-222222222201',
    'Bob Miller',
    '+1 323-555-0201',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    'Los Angeles, CA',
    'Cinematic editor with 6+ years on YouTube vlogs, travel films, and brand promos. Premiere Pro, After Effects, and custom sound design.',
    ARRAY['Video Editing', 'Premiere Pro', 'After Effects', 'Sound Design', 'Vlog Editing', 'Transitions'],
    ARRAY['https://youtube.com/watch?v=bob-travel-reel', 'https://vimeo.com/bobmiller-showreel'],
    45.00, 4.90, TRUE, NOW() - INTERVAL '88 days', NOW()
  ),
  (
    '22222222-2222-2222-3333-222222222202',
    '22222222-2222-2222-2222-222222222202',
    'Charlie Davis',
    '+1 512-555-0202',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80',
    'Austin, TX',
    '3D generalist and motion designer. SaaS explainers, logo reveals, and product renders in Blender, After Effects, and Cinema 4D.',
    ARRAY['Motion Graphics', 'Blender', '3D Animation', 'After Effects', 'VFX', 'Logo Animation'],
    ARRAY['https://vimeo.com/charliedavis-saas', 'https://behance.net/charliedavis'],
    60.00, 4.95, TRUE, NOW() - INTERVAL '70 days', NOW()
  ),
  (
    '22222222-2222-2222-3333-222222222203',
    '22222222-2222-2222-2222-222222222203',
    'Emma Stone',
    '+1 305-555-0203',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
    'Miami, FL',
    'DaVinci Resolve colorist. Commercial grades, wedding films, and music-video finishing with log profiles and film LUTs.',
    ARRAY['Color Grading', 'DaVinci Resolve', 'Color Correction', 'Music Video Editing', 'Commercials'],
    ARRAY['https://behance.net/emmastone-grade', 'https://youtube.com/watch?v=emma-wedding-grade'],
    55.00, 4.85, TRUE, NOW() - INTERVAL '55 days', NOW()
  ),
  (
    '22222222-2222-2222-3333-222222222204',
    '22222222-2222-2222-2222-222222222204',
    'Liam Ortega',
    '+1 646-555-0204',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
    'Brooklyn, NY',
    'Short-form specialist for TikTok, Reels, and YouTube Shorts. Captions, jump cuts, and retention-first pacing.',
    ARRAY['Shorts', 'Reels', 'TikTok', 'Captions', 'Premiere Pro', 'CapCut'],
    ARRAY['https://tiktok.com/@liamcuts', 'https://instagram.com/liam.edits'],
    35.00, 4.70, TRUE, NOW() - INTERVAL '20 days', NOW()
  );

-- Parent categories
INSERT INTO vem.vm_categories (id, name, parent_id, description, created_at) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Video Editing', NULL, 'Assembly, transitions, cutting, and storytelling.', NOW() - INTERVAL '100 days'),
  ('33333333-3333-3333-3333-333333333302', 'VFX & Motion Graphics', NULL, 'Animation, typography, intros, and CGI.', NOW() - INTERVAL '100 days'),
  ('33333333-3333-3333-3333-333333333303', 'Post-Production & Audio', NULL, 'Color, mix, noise reduction, and sound design.', NOW() - INTERVAL '100 days');

-- Subcategories
INSERT INTO vem.vm_categories (id, name, parent_id, description, created_at) VALUES
  ('44444444-4444-4444-4444-444444444401', 'YouTube & Vlogs', '33333333-3333-3333-3333-333333333301', 'Fast-paced edits for YouTube and vlogs.', NOW() - INTERVAL '100 days'),
  ('44444444-4444-4444-4444-444444444402', 'Shorts, Reels & TikToks', '33333333-3333-3333-3333-333333333301', 'Vertical shorts with captions and high-retention cuts.', NOW() - INTERVAL '100 days'),
  ('44444444-4444-4444-4444-444444444403', 'Cinematic & Documentary', '33333333-3333-3333-3333-333333333301', 'Narrative pacing and documentary assembly.', NOW() - INTERVAL '100 days'),
  ('44444444-4444-4444-4444-444444444404', 'Wedding & Event Videos', '33333333-3333-3333-3333-333333333301', 'Highlight reels and multi-cam event sync.', NOW() - INTERVAL '100 days'),
  ('44444444-4444-4444-4444-444444444405', '2D & 3D Animation', '33333333-3333-3333-3333-333333333302', 'Explainers, character work, and product animation.', NOW() - INTERVAL '100 days'),
  ('44444444-4444-4444-4444-444444444406', 'Intros & Logo Reveals', '33333333-3333-3333-3333-333333333302', 'Brand openers and end-card animation.', NOW() - INTERVAL '100 days'),
  ('44444444-4444-4444-4444-444444444407', 'Visual Effects (VFX)', '33333333-3333-3333-3333-333333333302', 'Keying, rotoscope, match move, and CGI comps.', NOW() - INTERVAL '100 days'),
  ('44444444-4444-4444-4444-444444444408', 'Color Grading & Tuning', '33333333-3333-3333-3333-333333333303', 'Log grades, LUT work, and camera matching.', NOW() - INTERVAL '100 days'),
  ('44444444-4444-4444-4444-444444444409', 'Sound Design & SFX', '33333333-3333-3333-3333-333333333303', 'Foley, impacts, and ambient beds.', NOW() - INTERVAL '100 days'),
  ('44444444-4444-4444-4444-444444444410', 'Audio Mixing & Clean-up', '33333333-3333-3333-3333-333333333303', 'Dialogue cleanup, compression, and music ducking.', NOW() - INTERVAL '100 days');

-- Jobs across real statuses used by the app
INSERT INTO vem.vm_jobs (id, client_id, category_id, title, description, location, pricing_model, budget, deadline, status, created_at, updated_at) VALUES
  (
    '55555555-5555-5555-5555-555555555501',
    '11111111-1111-1111-1111-111111111101',
    '44444444-4444-4444-4444-444444444401',
    'Fast-paced Japan travel vlog (8 minutes)',
    'Compile ~2 hours of Tokyo/Kyoto footage into an 8-minute YouTube vlog. Need text overlays, whoosh SFX, punch zooms, and a light grade. Style refs: Sam Kolder and Casey Neistat. Footage is on Google Drive.',
    'Remote', 'fixed', 320.00, NOW() + INTERVAL '5 days', 'posted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 hours'
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    '11111111-1111-1111-1111-111111111102',
    '44444444-4444-4444-4444-444444444405',
    'SaaS product showcase — 60s 3D explainer',
    '60-second 3D explainer for our analytics dashboard. Script and storyboard attached. Design abstract UI blocks, animate camera moves, and sync the supplied VO.',
    'Remote', 'fixed', 1200.00, NOW() + INTERVAL '12 days', 'assigned', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    '11111111-1111-1111-1111-111111111103',
    '44444444-4444-4444-4444-444444444408',
    'Color grade a 15-minute cinematic wedding film',
    'Sony S-Log3 wedding film. Need camera matching, natural skin, and a warm romantic look. Please share prior wedding grades.',
    'Remote', 'fixed', 450.00, NOW() - INTERVAL '2 days', 'completed', NOW() - INTERVAL '18 days', NOW() - INTERVAL '3 days'
  ),
  (
    '55555555-5555-5555-5555-555555555504',
    '11111111-1111-1111-1111-111111111104',
    '44444444-4444-4444-4444-444444444402',
    '12 Instagram Reels for a skincare launch',
    'Turn product b-roll into 12 vertical Reels (15–25s). Captions, beat-sync cuts, and on-brand lower thirds. Brand kit attached.',
    'Remote', 'hourly', 480.00, NOW() + INTERVAL '8 days', 'in_progress', NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 hours'
  ),
  (
    '55555555-5555-5555-5555-555555555505',
    '11111111-1111-1111-1111-111111111101',
    '44444444-4444-4444-4444-444444444406',
    'YouTube channel intro + end card',
    '3-second logo reveal and 8-second end card with subscribe animation. Channel name: VlogMedia. Need 4K ProRes and a 1080p H.264.',
    'Remote', 'negotiable', 150.00, NOW() + INTERVAL '14 days', 'posted', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
  ),
  (
    '55555555-5555-5555-5555-555555555506',
    '11111111-1111-1111-1111-111111111103',
    '44444444-4444-4444-4444-444444444404',
    'Corporate gala highlight (cancelled)',
    '4-minute highlight from a 6-hour gala. Multi-cam sync and speeches. Project cancelled after venue change.',
    'Chicago, IL', 'fixed', 800.00, NOW() + INTERVAL '20 days', 'cancelled', NOW() - INTERVAL '14 days', NOW() - INTERVAL '9 days'
  ),
  (
    '55555555-5555-5555-5555-555555555507',
    '11111111-1111-1111-1111-111111111102',
    '44444444-4444-4444-4444-444444444407',
    'Green-screen product demo cleanup',
    'Key messy green screen from 9 product takes, add a studio backdrop, and light wrap. Delivery as individual ProRes clips.',
    'Remote', 'fixed', 650.00, NOW() + INTERVAL '9 days', 'assigned', NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days'
  );

INSERT INTO vem.vm_job_attachments (id, job_id, file_url, file_name, file_size, created_at) VALUES
  ('aaaa1111-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555501', 'https://res.cloudinary.com/demo/raw/upload/japan_vlog_brief.pdf', 'japan_vlog_brief.pdf', 245760, NOW() - INTERVAL '2 days'),
  ('aaaa1111-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555502', 'https://res.cloudinary.com/demo/raw/upload/saas_storyboard.pdf', 'saas_storyboard_v3.pdf', 1048576, NOW() - INTERVAL '10 days'),
  ('aaaa1111-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555502', 'https://res.cloudinary.com/demo/video/upload/saas_vo.wav', 'saas_voiceover.wav', 8912896, NOW() - INTERVAL '10 days'),
  ('aaaa1111-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555504', 'https://res.cloudinary.com/demo/raw/upload/skincare_brand_kit.zip', 'skincare_brand_kit.zip', 15728640, NOW() - INTERVAL '6 days'),
  ('aaaa1111-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555503', 'https://res.cloudinary.com/demo/raw/upload/wedding_camera_reports.pdf', 'wedding_camera_reports.pdf', 188416, NOW() - INTERVAL '18 days');

INSERT INTO vem.vm_proposals (id, job_id, provider_id, bid_amount, estimated_days, proposal_text, status, created_at, updated_at) VALUES
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222201', 280.00, 4, 'Alex — I have cut 50+ travel vlogs in this style. I will handle SFX, zooms, and a clean grade, and can deliver a first cut in 4 days.', 'pending', NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day 6 hours'),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222203', 300.00, 5, 'I can edit the vlog and run a Resolve grade so the travel footage looks cinematic without crushing skin tones.', 'pending', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '18 hours'),
  ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555502', '22222222-2222-2222-2222-222222222202', 1200.00, 10, 'Sarah — I specialize in SaaS explainers. Blender for the 3D, After Effects for UI chrome. First style frames in 72 hours.', 'accepted', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days'),
  ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555503', '22222222-2222-2222-2222-222222222203', 450.00, 3, 'Michael — S-Log3 wedding work is my week-to-week. Warm grade, matched A/B cams, natural skin.', 'accepted', NOW() - INTERVAL '17 days', NOW() - INTERVAL '16 days'),
  ('66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555504', '22222222-2222-2222-2222-222222222204', 420.00, 6, 'Priya — I ship Reels batches for DTC brands. Captions, beat sync, and a shared review folder after every 4 videos.', 'accepted', NOW() - INTERVAL '5 days 12 hours', NOW() - INTERVAL '5 days'),
  ('66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555504', '22222222-2222-2222-2222-222222222201', 500.00, 7, 'I can take the Reels package as well if you want a more cinematic grade on the product shots.', 'rejected', NOW() - INTERVAL '5 days 8 hours', NOW() - INTERVAL '5 days'),
  ('66666666-6666-6666-6666-666666666607', '55555555-5555-5555-5555-555555555505', '22222222-2222-2222-2222-222222222202', 180.00, 3, 'Happy to do the intro + end card. I will send 2 style options before lock.', 'pending', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours'),
  ('66666666-6666-6666-6666-666666666608', '55555555-5555-5555-5555-555555555505', '22222222-2222-2222-2222-222222222204', 120.00, 2, 'I can turn this around in 48 hours with a clean motion pack you can reuse.', 'withdrawn', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '3 hours'),
  ('66666666-6666-6666-6666-666666666609', '55555555-5555-5555-5555-555555555507', '22222222-2222-2222-2222-222222222202', 650.00, 5, 'I will key, light-wrap, and deliver individual ProRes clips plus a contact-sheet review.', 'accepted', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days');

INSERT INTO vem.vm_contracts (id, job_id, proposal_id, client_id, provider_id, agreed_price, status, started_at, ended_at, created_at, updated_at) VALUES
  ('77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555502', '66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 1200.00, 'active', NOW() - INTERVAL '8 days', NULL, NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),
  ('77777777-7777-7777-7777-777777777702', '55555555-5555-5555-5555-555555555503', '66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', 450.00, 'completed', NOW() - INTERVAL '16 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '3 days'),
  ('77777777-7777-7777-7777-777777777703', '55555555-5555-5555-5555-555555555504', '66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222204', 420.00, 'revision_requested', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '8 hours'),
  ('77777777-7777-7777-7777-777777777704', '55555555-5555-5555-5555-555555555507', '66666666-6666-6666-6666-666666666609', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 650.00, 'disputed', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day');

INSERT INTO vem.vm_milestones (id, contract_id, title, amount, status, created_at, updated_at) VALUES
  ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', 'Style frames & 3D look-dev', 300.00, 'released', NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days'),
  ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777701', 'Animatic + first 20 seconds', 400.00, 'funded', NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days'),
  ('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777701', 'Final 4K render + mix', 500.00, 'pending', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777702', 'Full wedding grade + skin match', 450.00, 'released', NOW() - INTERVAL '16 days', NOW() - INTERVAL '3 days'),
  ('88888888-8888-8888-8888-888888888805', '77777777-7777-7777-7777-777777777703', 'First 4 Reels for review', 140.00, 'released', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
  ('88888888-8888-8888-8888-888888888806', '77777777-7777-7777-7777-777777777703', 'Remaining 8 Reels', 280.00, 'funded', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
  ('88888888-8888-8888-8888-888888888807', '77777777-7777-7777-7777-777777777704', 'Keyed product clips', 650.00, 'disputed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day');

INSERT INTO vem.vm_deliveries (id, contract_id, milestone_id, delivery_text, file_url, file_name, status, created_at) VALUES
  ('d1111111-1111-1111-1111-111111111101', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888801', 'Style frames and 3D look-dev for approval. Lighting is cooler than the storyboard — say if you want it warmer.', 'https://res.cloudinary.com/demo/image/upload/saas_style_frames.pdf', 'saas_style_frames.pdf', 'accepted', NOW() - INTERVAL '6 days'),
  ('d1111111-1111-1111-1111-111111111102', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888802', 'First 20 seconds animatic with temp VO. Camera path is locked unless you want a slower open.', 'https://res.cloudinary.com/demo/video/upload/saas_animatic_v1.mp4', 'saas_animatic_v1.mp4', 'pending_review', NOW() - INTERVAL '1 day'),
  ('d1111111-1111-1111-1111-111111111103', '77777777-7777-7777-7777-777777777702', '88888888-8888-8888-8888-888888888804', 'Wedding grade locked. Warm LUT, matched A/B cams, skin rolled back slightly from v1.', 'https://res.cloudinary.com/demo/video/upload/wedding_graded_final.mp4', 'wedding_graded_final.mp4', 'accepted', NOW() - INTERVAL '3 days'),
  ('d1111111-1111-1111-1111-111111111104', '77777777-7777-7777-7777-777777777703', '88888888-8888-8888-8888-888888888805', 'First 4 Reels. Caption style uses the brand kit bold weight.', 'https://res.cloudinary.com/demo/video/upload/reels_batch1.zip', 'reels_batch1.zip', 'rejected', NOW() - INTERVAL '2 days'),
  ('d1111111-1111-1111-1111-111111111105', '77777777-7777-7777-7777-777777777704', '88888888-8888-8888-8888-888888888807', 'Nine keyed ProRes clips. Hair edges are tight except take 04 (spill on the bottle).', 'https://res.cloudinary.com/demo/video/upload/keyed_takes.zip', 'keyed_takes_v1.zip', 'rejected', NOW() - INTERVAL '2 days');

INSERT INTO vem.vm_revisions (id, delivery_id, reason, created_at) VALUES
  ('aa111111-1111-1111-1111-111111111101', 'd1111111-1111-1111-1111-111111111104', 'Please slow the first 2 seconds, use the serif caption font from the brand kit, and keep the product label readable on Reel 3.', NOW() - INTERVAL '8 hours'),
  ('aa111111-1111-1111-1111-111111111102', 'd1111111-1111-1111-1111-111111111105', 'Take 04 still has green spill on the glass. Also the studio backdrop is 1 stop too dark versus the brief.', NOW() - INTERVAL '1 day');

INSERT INTO vem.vm_job_work_uploads (id, job_id, contract_id, provider_id, media_type, file_url, file_name, file_size, note, created_at) VALUES
  ('bb111111-1111-1111-1111-111111111101', '55555555-5555-5555-5555-555555555502', '77777777-7777-7777-7777-777777777701', '22222222-2222-2222-2222-222222222202', 'image', 'https://res.cloudinary.com/demo/image/upload/saas_styleframe_01.jpg', 'saas_styleframe_01.jpg', 1843200, 'Look-dev still — cooler key light', NOW() - INTERVAL '6 days'),
  ('bb111111-1111-1111-1111-111111111102', '55555555-5555-5555-5555-555555555502', '77777777-7777-7777-7777-777777777701', '22222222-2222-2222-2222-222222222202', 'video', 'https://res.cloudinary.com/demo/video/upload/saas_animatic_v1.mp4', 'saas_animatic_v1.mp4', 24117248, 'Animatic first 20s', NOW() - INTERVAL '1 day'),
  ('bb111111-1111-1111-1111-111111111103', '55555555-5555-5555-5555-555555555504', '77777777-7777-7777-7777-777777777703', '22222222-2222-2222-2222-222222222204', 'video', 'https://res.cloudinary.com/demo/video/upload/reel_01_draft.mp4', 'reel_01_draft.mp4', 12582912, 'Reel 01 draft before caption restyle', NOW() - INTERVAL '2 days'),
  ('bb111111-1111-1111-1111-111111111104', '55555555-5555-5555-5555-555555555503', '77777777-7777-7777-7777-777777777702', '22222222-2222-2222-2222-222222222203', 'video', 'https://res.cloudinary.com/demo/video/upload/wedding_graded_final.mp4', 'wedding_graded_final.mp4', 89456640, 'Final graded wedding film', NOW() - INTERVAL '3 days');

INSERT INTO vem.vm_transactions (id, contract_id, milestone_id, sender_id, receiver_id, amount, type, status, payment_gateway, reference_id, created_at) VALUES
  ('99999999-9999-9999-9999-999999999901', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888801', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 300.00, 'escrow_deposit', 'completed', 'stripe', 'ch_saas_ms1_dep', NOW() - INTERVAL '8 days'),
  ('99999999-9999-9999-9999-999999999902', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888801', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 300.00, 'escrow_release', 'completed', 'stripe', 'ch_saas_ms1_rel', NOW() - INTERVAL '6 days'),
  ('99999999-9999-9999-9999-999999999903', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888801', '22222222-2222-2222-2222-222222222202', 'a0000000-0000-0000-0000-000000000000', 30.00, 'platform_fee', 'completed', 'stripe', 'fee_saas_ms1', NOW() - INTERVAL '6 days'),
  ('99999999-9999-9999-9999-999999999904', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888802', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 400.00, 'escrow_deposit', 'completed', 'stripe', 'ch_saas_ms2_dep', NOW() - INTERVAL '2 days'),
  ('99999999-9999-9999-9999-999999999905', '77777777-7777-7777-7777-777777777702', '88888888-8888-8888-8888-888888888804', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', 450.00, 'escrow_deposit', 'completed', 'stripe', 'ch_wed_dep', NOW() - INTERVAL '16 days'),
  ('99999999-9999-9999-9999-999999999906', '77777777-7777-7777-7777-777777777702', '88888888-8888-8888-8888-888888888804', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', 450.00, 'escrow_release', 'completed', 'stripe', 'ch_wed_rel', NOW() - INTERVAL '3 days'),
  ('99999999-9999-9999-9999-999999999907', '77777777-7777-7777-7777-777777777702', '88888888-8888-8888-8888-888888888804', '22222222-2222-2222-2222-222222222203', 'a0000000-0000-0000-0000-000000000000', 45.00, 'platform_fee', 'completed', 'stripe', 'fee_wed', NOW() - INTERVAL '3 days'),
  ('99999999-9999-9999-9999-999999999908', '77777777-7777-7777-7777-777777777703', '88888888-8888-8888-8888-888888888805', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222204', 140.00, 'escrow_deposit', 'completed', 'razorpay', 'pay_reels_ms1', NOW() - INTERVAL '5 days'),
  ('99999999-9999-9999-9999-999999999909', '77777777-7777-7777-7777-777777777703', '88888888-8888-8888-8888-888888888805', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222204', 140.00, 'escrow_release', 'completed', 'razorpay', 'pay_reels_ms1_rel', NOW() - INTERVAL '2 days'),
  ('99999999-9999-9999-9999-999999999910', '77777777-7777-7777-7777-777777777703', '88888888-8888-8888-8888-888888888806', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222204', 280.00, 'escrow_deposit', 'completed', 'razorpay', 'pay_reels_ms2', NOW() - INTERVAL '1 day'),
  ('99999999-9999-9999-9999-999999999911', '77777777-7777-7777-7777-777777777704', '88888888-8888-8888-8888-888888888807', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 650.00, 'escrow_deposit', 'completed', 'stripe', 'ch_vfx_dep', NOW() - INTERVAL '6 days'),
  ('99999999-9999-9999-9999-999999999912', '77777777-7777-7777-7777-777777777704', '88888888-8888-8888-8888-888888888807', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 650.00, 'escrow_refund', 'pending', 'stripe', 'ch_vfx_ref_hold', NOW() - INTERVAL '1 day');

INSERT INTO vem.vm_disputes (id, contract_id, raised_by_id, reason, status, resolution_details, created_at, updated_at) VALUES
  (
    'cc111111-1111-1111-1111-111111111101',
    '77777777-7777-7777-7777-777777777704',
    '11111111-1111-1111-1111-111111111102',
    'Keyed footage still shows green spill on glass and the backdrop does not match the approved still. Requesting a recut or partial refund.',
    'open',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  );

INSERT INTO vem.vm_reviews (id, contract_id, reviewer_id, reviewee_id, rating_quality, rating_communication, rating_timeliness, overall_rating, comment, created_at) VALUES
  ('f1111111-1111-1111-1111-111111111101', '77777777-7777-7777-7777-777777777702', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', 5, 5, 5, 5.00, 'Emma nailed the skin tones and the warm wedding look. Will hire again for our next event film.', NOW() - INTERVAL '3 days'),
  ('f1111111-1111-1111-1111-111111111102', '77777777-7777-7777-7777-777777777702', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103', 5, 5, 5, 5.00, 'Michael sent a clear brief, responded the same day, and released the milestone as soon as we locked.', NOW() - INTERVAL '3 days');

INSERT INTO vem.vm_chat_rooms (id, job_id, created_at) VALUES
  ('e1111111-1111-1111-1111-111111111101', '55555555-5555-5555-5555-555555555501', NOW() - INTERVAL '1 day 8 hours'),
  ('e1111111-1111-1111-1111-111111111102', '55555555-5555-5555-5555-555555555502', NOW() - INTERVAL '8 days'),
  ('e1111111-1111-1111-1111-111111111103', '55555555-5555-5555-5555-555555555504', NOW() - INTERVAL '5 days'),
  ('e1111111-1111-1111-1111-111111111104', '55555555-5555-5555-5555-555555555507', NOW() - INTERVAL '6 days');

INSERT INTO vem.vm_chat_members (room_id, user_id) VALUES
  ('e1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111101'),
  ('e1111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201'),
  ('e1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111102'),
  ('e1111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202'),
  ('e1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111104'),
  ('e1111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222204'),
  ('e1111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111102'),
  ('e1111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222202');

INSERT INTO vem.vm_messages (id, room_id, sender_id, message_text, file_url, file_name, created_at) VALUES
  ('dd111111-1111-1111-1111-111111111101', 'e1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111101', 'Hey Bob — saw the travel reel. Do you license your own SFX library or do I need to supply music?', NULL, NULL, NOW() - INTERVAL '1 day 5 hours'),
  ('dd111111-1111-1111-1111-111111111102', 'e1111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'I have Epidemic Sound + a custom whoosh pack. If you have a track you want, drop the link and I will cut to it.', NULL, NULL, NOW() - INTERVAL '1 day 4 hours'),
  ('dd111111-1111-1111-1111-111111111103', 'e1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111102', 'Style frames look great. Can you warm the key light about 400K for the dashboard hero?', NULL, NULL, NOW() - INTERVAL '6 days'),
  ('dd111111-1111-1111-1111-111111111104', 'e1111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 'Done — I will push a warmer still with the animatic tomorrow.', 'https://res.cloudinary.com/demo/image/upload/saas_styleframe_01.jpg', 'saas_styleframe_01.jpg', NOW() - INTERVAL '5 days 20 hours'),
  ('dd111111-1111-1111-1111-111111111105', 'e1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111104', 'Reel 3 caption is covering the product name. Can you raise it?', NULL, NULL, NOW() - INTERVAL '10 hours'),
  ('dd111111-1111-1111-1111-111111111106', 'e1111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222204', 'On it — switching to the serif kit font and lifting captions 80px.', NULL, NULL, NOW() - INTERVAL '7 hours'),
  ('dd111111-1111-1111-1111-111111111107', 'e1111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111102', 'Take 04 still has spill. Opening a dispute so we can get a clean recut or refund.', NULL, NULL, NOW() - INTERVAL '1 day');

INSERT INTO vem.vm_notifications (id, user_id, title, message, type, is_read, created_at) VALUES
  ('ee111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111101', 'New proposal received', 'Bob Miller bid $280 on “Fast-paced Japan travel vlog (8 minutes)”.', 'proposal_update', FALSE, NOW() - INTERVAL '1 day 6 hours'),
  ('ee111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111101', 'New proposal received', 'Emma Stone bid $300 on “Fast-paced Japan travel vlog (8 minutes)”.', 'proposal_update', FALSE, NOW() - INTERVAL '18 hours'),
  ('ee111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222202', 'Milestone funded', 'Sarah Jenkins funded “Animatic + first 20 seconds” ($400).', 'payment', TRUE, NOW() - INTERVAL '2 days'),
  ('ee111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222203', 'Contract completed', 'Michael Chang accepted the wedding grade and left a 5-star review.', 'contract_update', TRUE, NOW() - INTERVAL '3 days'),
  ('ee111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222204', 'Revision requested', 'Priya Nair asked for caption and pacing changes on the first Reels batch.', 'job_update', FALSE, NOW() - INTERVAL '8 hours'),
  ('ee111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222202', 'Dispute opened', 'Sarah Jenkins opened a dispute on “Green-screen product demo cleanup”.', 'contract_update', FALSE, NOW() - INTERVAL '1 day'),
  ('ee111111-1111-1111-1111-111111111107', 'a0000000-0000-0000-0000-000000000000', 'Provider awaiting approval', 'editor.pending@example.com requested the PROVIDER role.', 'system', FALSE, NOW() - INTERVAL '2 days'),
  ('ee111111-1111-1111-1111-111111111108', '11111111-1111-1111-1111-111111111104', 'New message', 'Liam Ortega replied about Reel 3 captions.', 'message', FALSE, NOW() - INTERVAL '7 hours');

-- =============================================================================
-- Quick sanity counts (optional; safe to leave)
-- =============================================================================
-- SELECT 'vem.vm_users' AS table_name, COUNT(*) FROM vem.vm_users
-- UNION ALL SELECT 'vem.vm_jobs', COUNT(*) FROM vem.vm_jobs
-- UNION ALL SELECT 'vem.vm_proposals', COUNT(*) FROM vem.vm_proposals
-- UNION ALL SELECT 'vem.vm_contracts', COUNT(*) FROM vem.vm_contracts;

-- Video Edit Marketplace Platform - Dummy Seed Data (PostgreSQL)
-- This script inserts demo data into all database tables.

-- Clear existing data (in reverse dependency order to prevent constraint errors)
TRUNCATE TABLE
  video_editor.notifications,
  video_editor.messages,
  video_editor.chat_members,
  video_editor.chat_rooms,
  video_editor.reviews,
  video_editor.disputes,
  video_editor.transactions,
  video_editor.revisions,
  video_editor.deliveries,
  video_editor.milestones,
  video_editor.contracts,
  video_editor.proposals,
  video_editor.job_attachments,
  video_editor.jobs,
  video_editor.categories,
  video_editor.provider_profiles,
  video_editor.client_profiles,
  video_editor.user_roles,
  video_editor.roles,
  video_editor.users
CASCADE;

-- 1. Insert Roles
INSERT INTO video_editor.roles (id, name, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'CLIENT', NOW()),
  ('c0000000-0000-0000-0000-000000000002', 'PROVIDER', NOW()),
  ('c0000000-0000-0000-0000-000000000003', 'ADMIN', NOW());

-- 2. Insert Users
-- Passwords:
-- Admin: admin123 -> $2b$10$3IjRJo3IxPT4CH4/2xic6.Issh1ZfjLhCm6yUJSEM/F6QfyzorC9q
-- Clients & Editors: password123 -> $2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa
INSERT INTO video_editor.users (id, email, password_hash, is_active, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000000', 'admin@videoeditmarket.com', '$2b$10$3IjRJo3IxPT4CH4/2xic6.Issh1ZfjLhCm6yUJSEM/F6QfyzorC9q', TRUE, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111101', 'client.alex@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', TRUE, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111102', 'client.sarah@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', TRUE, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111103', 'client.michael@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', TRUE, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222201', 'editor.bob@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', TRUE, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222202', 'editor.charlie@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', TRUE, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222203', 'editor.emma@example.com', '$2b$10$N8udLPWs.FYS8Ox4NYCQF.PoGRNjp7o.3X5sg.Nz9mTcZKFAt3zVa', TRUE, NOW(), NOW());

-- 3. Assign User Roles
INSERT INTO video_editor.user_roles (user_id, role_id, status, assigned_at) VALUES
  ('a0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000003', 'approved', NOW()), -- Admin
  ('11111111-1111-1111-1111-111111111101', 'c0000000-0000-0000-0000-000000000001', 'approved', NOW()), -- Client Alex
  ('11111111-1111-1111-1111-111111111102', 'c0000000-0000-0000-0000-000000000001', 'approved', NOW()), -- Client Sarah
  ('11111111-1111-1111-1111-111111111103', 'c0000000-0000-0000-0000-000000000001', 'approved', NOW()), -- Client Michael
  ('22222222-2222-2222-2222-222222222201', 'c0000000-0000-0000-0000-000000000002', 'approved', NOW()), -- Editor Bob
  ('22222222-2222-2222-2222-222222222202', 'c0000000-0000-0000-0000-000000000002', 'approved', NOW()), -- Editor Charlie
  ('22222222-2222-2222-2222-222222222203', 'c0000000-0000-0000-0000-000000000002', 'approved', NOW()); -- Editor Emma

-- 4. Create Client Profiles
INSERT INTO video_editor.client_profiles (id, user_id, full_name, phone_number, avatar_url, address, created_at, updated_at) VALUES
  ('11111111-1111-1111-2222-111111111101', '11111111-1111-1111-1111-111111111101', 'Alex Reed (VlogMedia)', '+1 555-0101', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', 'New York, NY', NOW(), NOW()),
  ('11111111-1111-1111-2222-111111111102', '11111111-1111-1111-1111-111111111102', 'Sarah Jenkins (TechFlow)', '+1 555-0102', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', 'San Francisco, CA', NOW(), NOW()),
  ('11111111-1111-1111-2222-111111111103', '11111111-1111-1111-1111-111111111103', 'Michael Chang (Events Co)', '+1 555-0103', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', 'Chicago, IL', NOW(), NOW());

-- 5. Create Provider Profiles
INSERT INTO video_editor.provider_profiles (id, user_id, full_name, phone_number, avatar_url, address, bio, skills, portfolio_urls, hourly_rate, average_rating, is_available, created_at, updated_at) VALUES
  ('22222222-2222-2222-3333-222222222201', '22222222-2222-2222-2222-222222222201', 'Bob Miller', '+1 555-0201', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', 'Los Angeles, CA', 'Cinematic video editor with 6+ years of experience editing high-pace YouTube vlogs, travel films, and promotional videos. Advanced skills in Premiere Pro, After Effects, and sound design.', ARRAY['Video Editing', 'Premiere Pro', 'After Effects', 'Sound Design', 'Vlog Editing', 'Transitions'], ARRAY['https://youtube.com/watch?v=demo1', 'https://youtube.com/watch?v=demo2'], 45.00, 4.90, TRUE, NOW(), NOW()),
  ('22222222-2222-2222-3333-222222222202', '22222222-2222-2222-2222-222222222202', 'Charlie Davis', '+1 555-0202', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80', 'Austin, TX', '3D generalist, motion designer, and VFX specialist. I create stunning explainer videos, logo animations, and product renders using Blender, After Effects, and Cinema4D.', ARRAY['Motion Graphics', 'Blender', '3D Animation', 'After Effects', 'VFX', 'Logo Animation'], ARRAY['https://vimeo.com/demo3', 'https://vimeo.com/demo4'], 60.00, 4.95, TRUE, NOW(), NOW()),
  ('22222222-2222-2222-3333-222222222203', '22222222-2222-2222-2222-222222222203', 'Emma Stone', '+1 555-0203', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80', 'Miami, FL', 'Certified DaVinci Resolve colorist and video editor. Specializing in high-end commercial color grading, documentary color matching, and music video post-production.', ARRAY['Color Grading', 'DaVinci Resolve', 'Color Correction', 'Music Video Editing', 'Commercials'], ARRAY['https://behance.net/portfolio1', 'https://youtube.com/watch?v=color1'], 55.00, 4.85, TRUE, NOW(), NOW());

-- 6. Insert Categories (Parent & Subcategories)
-- Video Editing
INSERT INTO video_editor.categories (id, name, parent_id, description, created_at) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Video Editing', NULL, 'Core video assembly, transitions, cutting, storytelling and sync services.', NOW());
INSERT INTO video_editor.categories (id, name, parent_id, description, created_at) VALUES
  ('44444444-4444-4444-4444-444444444401', 'YouTube & Vlogs', '33333333-3333-3333-3333-333333333301', 'Highly engaging, fast-paced video edits optimized for YouTube and social media vlogs.', NOW()),
  ('44444444-4444-4444-4444-444444444402', 'Shorts, Reels & TikToks', '33333333-3333-3333-3333-333333333301', 'Vertical format short videos with dynamic subtitles, captions and high-retention cuts.', NOW()),
  ('44444444-4444-4444-4444-444444444403', 'Cinematic & Documentary', '33333333-3333-3333-3333-333333333301', 'Paced storytelling, narrative flow, documentary formats, and film editing.', NOW()),
  ('44444444-4444-4444-4444-444444444404', 'Wedding & Event Videos', '33333333-3333-3333-3333-333333333301', 'Memorable compilations, multi-cam event syncing, wedding highlight reels.', NOW());

-- VFX & Motion Graphics
INSERT INTO video_editor.categories (id, name, parent_id, description, created_at) VALUES
  ('33333333-3333-3333-3333-333333333302', 'VFX & Motion Graphics', NULL, 'Animations, text typography overlays, intro sequences, and computer graphics.', NOW());
INSERT INTO video_editor.categories (id, name, parent_id, description, created_at) VALUES
  ('44444444-4444-4444-4444-444444444405', '2D & 3D Animation', '33333333-3333-3333-3333-333333333302', 'Character animation, product explainer animations, and isometric scenes.', NOW()),
  ('44444444-4444-4444-4444-444444444406', 'Intros & Logo Reveals', '33333333-3333-3333-3333-333333333302', 'Dynamic branding animation to start or end professional video clips.', NOW()),
  ('44444444-4444-4444-4444-444444444407', 'Visual Effects (VFX)', '33333333-3333-3333-3333-333333333302', 'Green screen keying, rotoscoping, match moving, and CGI composition.', NOW());

-- Post-Production & Audio
INSERT INTO video_editor.categories (id, name, parent_id, description, created_at) VALUES
  ('33333333-3333-3333-3333-333333333303', 'Post-Production & Audio', NULL, 'Finishing touches including coloring, sound balancing, noise filtering, and sound design.', NOW());
INSERT INTO video_editor.categories (id, name, parent_id, description, created_at) VALUES
  ('44444444-4444-4444-4444-444444444408', 'Color Grading & Tuning', '33333333-3333-3333-3333-333333333303', 'Professional color matching, lut application, and grading log profiles.', NOW()),
  ('44444444-4444-4444-4444-444444444409', 'Sound Design & SFX', '33333333-3333-3333-3333-333333333303', 'Foley sound effect design, ambient audio tracks, and cinematic impact elements.', NOW()),
  ('44444444-4444-4444-4444-444444444410', 'Audio Mixing & Clean-up', '33333333-3333-3333-3333-333333333303', 'Wind/noise removal, voice over compression, dialog leveling, and music ducking.', NOW());

-- 7. Insert Jobs
INSERT INTO video_editor.jobs (id, client_id, category_id, title, description, location, pricing_model, budget, deadline, status, created_at, updated_at) VALUES
  -- Job 1: Vlog Editing (Open)
  ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111101', '44444444-4444-4444-4444-444444444401', 'Fast-Paced Travel Vlog Video Editor', 'Looking for an editor who can compile 2 hours of raw travel footage into a highly engaging, 8-minute YouTube vlog. Needs custom text overlays, trendy sound effects, zoom-ins, and color correction. Style reference: Sam Kolder / Casey Neistat. Deadline is 5 days. Footage provided via Google Drive.', 'Remote', 'fixed', 300.00, NOW() + INTERVAL '5 days', 'posted', NOW(), NOW()),
  
  -- Job 2: 3D Explainer (Assigned / Contract Active)
  ('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111102', '44444444-4444-4444-4444-444444444405', 'SaaS Product Showcase 3D Explainer Video', 'We need a 60-second 3D animation explainer for our new SaaS platform. Script and storyboard are ready. You will design the 3D abstract components, animate them, and integrate the voice-over track. High-quality production value is required.', 'Remote', 'fixed', 1200.00, NOW() + INTERVAL '12 days', 'assigned', NOW(), NOW()),

  -- Job 3: Wedding Film Grading (Completed)
  ('55555555-5555-5555-5555-555555555503', '11111111-1111-1111-1111-111111111103', '44444444-4444-4444-4444-444444444408', 'Colorist needed for Cinematic Wedding Film', 'Need a professional colorist to color grade a 15-minute cinematic wedding film shot on Sony S-Log3. Requirements: color correction, skin tone balancing, and applying a warm, romantic, cinematic look. Please share your portfolio of graded wedding videos.', 'Remote', 'fixed', 450.00, NOW() - INTERVAL '2 days', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day');

-- 8. Insert Proposals (Bids)
INSERT INTO video_editor.proposals (id, job_id, provider_id, bid_amount, estimated_days, proposal_text, status, created_at, updated_at) VALUES
  -- Bob bids on Job 1 (Pending)
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222201', 280.00, 4, 'Hey Alex! I have edited over 50 travel vlogs and can match the Sam Kolder style perfectly. I do professional sound design and seamless zoom transitions. I can deliver in 4 days.', 'pending', NOW(), NOW()),
  
  -- Emma bids on Job 1 (Pending)
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222203', 300.00, 5, 'Hi, I can edit this travel vlog and provide professional color correction in DaVinci Resolve. I will make the travel footage pop and look extremely cinematic.', 'pending', NOW(), NOW()),
  
  -- Charlie bids on Job 2 (Accepted)
  ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555502', '22222222-2222-2222-2222-222222222202', 1200.00, 10, 'Hello Sarah! As a 3D animator specializing in product and SaaS explainers, I can bring your storyboard to life. I use Blender for ultra-sharp rendering and After Effects for slick UI motion elements.', 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  
  -- Emma bids on Job 3 (Accepted)
  ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555503', '22222222-2222-2222-2222-222222222203', 450.00, 3, 'Hi Michael, I grade wedding films weekly. S-Log3 is my specialty and I can deliver a beautiful, warm cinematic tone with glowing skin tones. Let''s do this!', 'accepted', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days');

-- 9. Insert Contracts
INSERT INTO video_editor.contracts (id, job_id, proposal_id, client_id, provider_id, agreed_price, status, started_at, ended_at, created_at, updated_at) VALUES
  -- Contract 1: Active 3D animation contract
  ('77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555502', '66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 1200.00, 'active', NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  
  -- Contract 2: Completed Wedding colorist contract
  ('77777777-7777-7777-7777-777777777702', '55555555-5555-5555-5555-555555555503', '66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', 450.00, 'completed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day');

-- 10. Insert Milestones for Contracts
INSERT INTO video_editor.milestones (id, contract_id, title, amount, status, created_at, updated_at) VALUES
  -- Contract 1 Milestones
  ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', 'UI/UX Design Mockups & Style Frames', 300.00, 'released', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
  ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777701', 'First Draft Animation Clip', 400.00, 'funded', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
  ('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777701', 'Final 4K Render & Sound FX Mix', 500.00, 'pending', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  
  -- Contract 2 Milestones
  ('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777702', 'Full Wedding Grading & Skin Tone Matching', 450.00, 'released', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day');

-- 11. Insert Deliveries
INSERT INTO video_editor.deliveries (id, contract_id, milestone_id, delivery_text, file_url, file_name, status, created_at) VALUES
  -- Contract 1 Milestone 1 Delivery
  ('d1111111-1111-1111-1111-111111111101', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888801', 'Here are the initial 3D models and style frames for your review. Let me know if the art direction is correct!', 'https://example.com/deliveries/style_frames.pdf', 'style_frames.pdf', 'accepted', NOW() - INTERVAL '2 days'),
  
  -- Contract 2 Milestone 1 Delivery
  ('d1111111-1111-1111-1111-111111111102', '77777777-7777-7777-7777-777777777702', '88888888-8888-8888-8888-888888888804', 'Wedding video color grading is finished. I used a warm cinematic lut and color-matched all camera angles.', 'https://example.com/deliveries/wedding_graded.mp4', 'wedding_graded_final.mp4', 'accepted', NOW() - INTERVAL '1 day');

-- 12. Insert Transactions
INSERT INTO video_editor.transactions (id, contract_id, milestone_id, sender_id, receiver_id, amount, type, status, payment_gateway, reference_id, created_at) VALUES
  -- Contract 1 deposits/releases
  ('99999999-9999-9999-9999-999999999901', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888801', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 300.00, 'escrow_deposit', 'completed', 'stripe', 'ch_st_001', NOW() - INTERVAL '3 days'),
  ('99999999-9999-9999-9999-999999999902', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888801', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 300.00, 'escrow_release', 'completed', 'stripe', 'ch_st_002', NOW() - INTERVAL '2 days'),
  ('99999999-9999-9999-9999-999999999903', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888802', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 400.00, 'escrow_deposit', 'completed', 'stripe', 'ch_st_003', NOW() - INTERVAL '1 day'),
  
  -- Contract 2 deposits/releases
  ('99999999-9999-9999-9999-999999999904', '77777777-7777-7777-7777-777777777702', '88888888-8888-8888-8888-888888888804', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', 450.00, 'escrow_deposit', 'completed', 'stripe', 'ch_st_004', NOW() - INTERVAL '4 days'),
  ('99999999-9999-9999-9999-999999999905', '77777777-7777-7777-7777-777777777702', '88888888-8888-8888-8888-888888888804', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', 450.00, 'escrow_release', 'completed', 'stripe', 'ch_st_005', NOW() - INTERVAL '1 day');

-- 13. Insert Reviews
INSERT INTO video_editor.reviews (id, contract_id, reviewer_id, reviewee_id, rating_quality, rating_communication, rating_timeliness, overall_rating, comment, created_at) VALUES
  -- Client Michael reviews Emma
  ('f1111111-1111-1111-1111-111111111101', '77777777-7777-7777-7777-777777777702', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', 5, 5, 5, 5.00, 'Emma did an outstanding job! The skin tones look extremely natural and the cinematic wedding grade is gorgeous. Will hire again!', NOW() - INTERVAL '1 day'),
  -- Emma reviews Client Michael
  ('f1111111-1111-1111-1111-111111111102', '77777777-7777-7777-7777-777777777702', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103', 5, 5, 5, 5.00, 'Michael was fantastic to work with. Clear briefs, responsive feedback, and quick milestone releases.', NOW() - INTERVAL '1 day');

-- 14. Insert Chat Rooms & Members
-- Room 1 (Job 1 chat between Alex and Bob)
INSERT INTO video_editor.chat_rooms (id, job_id, created_at) VALUES
  ('e1111111-1111-1111-1111-111111111101', '55555555-5555-5555-5555-555555555501', NOW() - INTERVAL '2 days');
INSERT INTO video_editor.chat_members (room_id, user_id) VALUES
  ('e1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111101'),
  ('e1111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201');

-- Room 2 (Job 2 chat between Sarah and Charlie)
INSERT INTO video_editor.chat_rooms (id, job_id, created_at) VALUES
  ('e1111111-1111-1111-1111-111111111102', '55555555-5555-5555-5555-555555555502', NOW() - INTERVAL '3 days');
INSERT INTO video_editor.chat_members (room_id, user_id) VALUES
  ('e1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111102'),
  ('e1111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202');

-- 15. Insert Chat Messages
INSERT INTO video_editor.messages (id, room_id, sender_id, message_text, created_at) VALUES
  -- Chat Room 1
  ('a1111111-1111-1111-1111-111111111101', 'e1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111101', 'Hey Bob, saw your travel vlog portfolio. Do you do custom sound design?', NOW() - INTERVAL '1 day 5 hours'),
  ('a1111111-1111-1111-1111-111111111102', 'e1111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'Yes Alex! I use sound effects and background ambient tracks to give transitions a cinematic impact. I have a license for full audio libraries.', NOW() - INTERVAL '1 day 4 hours'),

  -- Chat Room 2
  ('a1111111-1111-1111-1111-111111111103', 'e1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111102', 'Hi Charlie, excited to get started on the explainer video.', NOW() - INTERVAL '3 days'),
  ('a1111111-1111-1111-1111-111111111104', 'e1111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 'Me too, Sarah! I will start working on the style frames and initial 3D components and send them over by Tuesday.', NOW() - INTERVAL '2 days 20 hours');

-- 16. Insert Notifications
INSERT INTO video_editor.notifications (id, user_id, title, message, type, is_read, created_at) VALUES
  ('b1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111101', 'New Proposal Received', 'Bob Miller has submitted a bid on your job "Fast-Paced Travel Vlog Video Editor".', 'proposal_update', FALSE, NOW() - INTERVAL '2 hours'),
  ('b1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111101', 'New Proposal Received', 'Emma Stone has submitted a bid on your job "Fast-Paced Travel Vlog Video Editor".', 'proposal_update', FALSE, NOW() - INTERVAL '1 hour'),
  ('b1111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222202', 'Milestone Funded', 'Sarah Jenkins funded Milestone 1: UI/UX Design Mockups & Style Frames.', 'payment', FALSE, NOW() - INTERVAL '3 days'),
  ('b1111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222203', 'Contract Completed', 'Michael Chang accepted your delivery and completed the contract. Review received!', 'contract_update', FALSE, NOW() - INTERVAL '1 day');

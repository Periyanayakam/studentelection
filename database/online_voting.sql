-- Consolidated database setup for ElectVote Secure Online Voting System
-- Sets up the core system plus all advanced features (sandbox, timeline phases, manifestos, badges, activity feed)

CREATE DATABASE IF NOT EXISTS votingdb;
USE votingdb;

-- ── DROP TABLES IN CORRECT RELATION ORDER ──────────────────────────────────
DROP TABLE IF EXISTS voter_badges;
DROP TABLE IF EXISTS activity_feed;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS elections;
DROP TABLE IF EXISTS users;

-- ── 1. Users Table (Admin & Voters) ────────────────────────────────────────
-- Password for seeded accounts is 'password123'
-- Bcrypt Hash: $2b$10$V3FPCd4CM4OJ4fY4FqK74O57JW9R85.dpXrz7iB2gkkYxC/N7ddJG
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'voter') DEFAULT 'voter',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. Elections Table (With Sandbox & Phases Support) ─────────────────────
CREATE TABLE elections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
    is_sandbox TINYINT(1) NOT NULL DEFAULT 0,
    phase ENUM('registration','nomination','campaign','voting','closed','published') NOT NULL DEFAULT 'voting'
);

-- ── 3. Candidates Table (With Rich Profile & Achievements) ──────────────────
CREATE TABLE candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    election_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    party VARCHAR(255) NOT NULL,
    symbol VARCHAR(100),
    photo VARCHAR(255),
    manifesto TEXT,
    department VARCHAR(100),
    year VARCHAR(20),
    achievements JSON,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
);

-- ── 4. Votes Table (Composite Key Prevent Double Voting) ───────────────────
CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voter_id INT NOT NULL,
    candidate_id INT NOT NULL,
    election_id INT NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
    UNIQUE KEY unique_voter_election (voter_id, election_id)
);

-- ── 5. Activity Feed Table (Live Updates Logs) ──────────────────────────────
CREATE TABLE activity_feed (
    id INT AUTO_INCREMENT PRIMARY KEY,
    election_id INT NOT NULL,
    message VARCHAR(500) NOT NULL,
    event_type ENUM('info', 'milestone', 'warning') DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
);

-- ── 6. Voter Badges Table (Achievement System) ──────────────────────────────
CREATE TABLE voter_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voter_id INT NOT NULL,
    badge_key VARCHAR(50) NOT NULL,
    election_id INT,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_voter_badge (voter_id, badge_key, election_id),
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── 7. SEED DATA ───────────────────────────────────────────────────────────

-- Seed Users
INSERT INTO users (id, fullname, email, phone, password, role)
VALUES
    (1, 'System Administrator', 'admin@voting.com', '+1234567890', '$2b$10$V3FPCd4CM4OJ4fY4FqK74O57JW9R85.dpXrz7iB2gkkYxC/N7ddJG', 'admin'),
    (2, 'John Doe (Voter)', 'john@voting.com', '+1987654321', '$2b$10$V3FPCd4CM4OJ4fY4FqK74O57JW9R85.dpXrz7iB2gkkYxC/N7ddJG', 'voter');

-- Seed Elections
INSERT INTO elections (id, title, description, start_date, end_date, status, is_sandbox, phase)
VALUES
    (1, 'Student Council Election 2026', 'Annual election for the President and Vice President roles of the Student Council association.', '2026-07-01 09:00:00', '2026-07-30 18:00:00', 'active', 0, 'voting'),
    (2, 'Department Rep By-Election', 'By-election to choose the computer science department representative.', '2026-08-01 09:00:00', '2026-08-15 18:00:00', 'upcoming', 0, 'nomination'),
    (3, 'Sandbox Practice Election', 'Try out the voting portal, see how the ballot box works without affecting the real election results.', '2026-07-01 09:00:00', '2026-08-30 18:00:00', 'active', 1, 'voting');

-- Seed Candidates
INSERT INTO candidates (id, election_id, name, party, symbol, photo, manifesto, department, year, achievements)
VALUES
    (1, 1, 'Jordan Williams', 'Progressive Alliance', 'bi-rocket-takeoff-fill', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80', 'I pledge to modernize our student council by launching a digital feedback platform, reducing exam stress through wellness programs, and creating interdepartmental collaboration.', 'Computer Science', '3rd Year', '["bi-trophy-fill", "bi-code-slash", "bi-mortarboard-fill"]'),
    (2, 1, 'Maya Patel', 'Student Unity Group', 'bi-people-fill', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 'My focus is unity — bringing together students from all departments. I will establish peer mentorship, negotiate library hours, and host monthly open town halls.', 'Information Technology', '2nd Year', '["bi-people-fill", "bi-heart-fill", "bi-globe"]'),
    (3, 3, 'Practice Alpha', 'Sandbox Party A', 'bi-hand-thumbs-up-fill', '', 'This is a practice manifesto. Feel free to vote for me to see how the system operates.', 'Mechanical', '1st Year', '["bi-rocket"]'),
    (4, 3, 'Practice Beta', 'Sandbox Party B', 'bi-emoji-smile-fill', '', 'Practice voting with me! Sandbox mode ensures no real ballots are changed.', 'Civil', '4th Year', '["bi-star"]');

-- Seed Activity Feed Events
INSERT INTO activity_feed (election_id, message, event_type)
VALUES
    (1, 'Election officially launched — voting is now open!', 'info'),
    (1, 'First 10 ballots have been submitted.', 'milestone'),
    (3, 'Sandbox mode initialized. Try placing a test ballot!', 'info');

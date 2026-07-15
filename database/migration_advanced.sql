-- ElectVote Advanced Features Migration
-- Run this AFTER the base schema is applied (online_voting.sql)

USE votingdb;

-- ── 1. Elections: Sandbox Mode + Phase Timeline ──────────────────────────
ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS is_sandbox TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phase ENUM('registration','nomination','campaign','voting','closed','published') NOT NULL DEFAULT 'voting';

-- ── 2. Candidates: Manifesto + Profile + Achievement Badges ──────────────
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS manifesto TEXT,
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS year VARCHAR(20),
  ADD COLUMN IF NOT EXISTS achievements JSON;

-- ── 3. Activity Feed Table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_feed (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  election_id INT NOT NULL,
  message     VARCHAR(500) NOT NULL,
  event_type  ENUM('info','milestone','warning') DEFAULT 'info',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
);

-- ── 4. Voter Badges Table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voter_badges (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  voter_id    INT NOT NULL,
  badge_key   VARCHAR(50) NOT NULL,
  election_id INT,
  awarded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_voter_badge (voter_id, badge_key, election_id),
  FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── 5. Seed: Update existing candidates with richer data ─────────────────
UPDATE candidates SET
  manifesto   = 'I pledge to modernize our student council by launching a digital feedback platform, reducing exam stress through structured wellness programs, and creating interdepartmental collaboration projects. I believe every student deserves a voice, and I will ensure that voice is heard at every faculty meeting.',
  department  = 'Computer Science',
  year        = '3rd Year',
  achievements = JSON_ARRAY('bi-trophy-fill', 'bi-code-slash', 'bi-mortarboard-fill')
WHERE id = 1;

UPDATE candidates SET
  manifesto   = 'My focus is unity — bringing together students from all departments. I will establish a peer mentorship program, negotiate better library hours, create a sustainable campus initiative, and host monthly open town halls where students can directly address admin concerns.',
  department  = 'Information Technology',
  year        = '2nd Year',
  achievements = JSON_ARRAY('bi-people-fill', 'bi-heart-fill', 'bi-globe')
WHERE id = 2;

-- ── 6. Seed: Activity feed for the active election ───────────────────────
INSERT IGNORE INTO activity_feed (election_id, message, event_type)
VALUES
  (1, 'Election officially launched — voting is now open!', 'info'),
  (1, 'First 10 ballots have been submitted.', 'milestone'),
  (1, 'Voting is progressing well. Stay engaged!', 'info');

-- ── 7. Update election phases to match status ────────────────────────────
UPDATE elections SET phase = 'voting'    WHERE status = 'active';
UPDATE elections SET phase = 'published' WHERE status = 'completed';
UPDATE elections SET phase = 'nomination' WHERE status = 'upcoming';


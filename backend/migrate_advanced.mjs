// Migration runner for advanced features - compatible with older MySQL versions
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const conn = await mysql.createConnection({
  host:     process.env.DB_HOST || '127.0.0.1',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'votingdb',
  multipleStatements: false,
});

// Helper: add column only if it doesn't exist
async function addColumnIfMissing(table, column, definition) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length === 0) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`  ✅ Added column: ${table}.${column}`);
  } else {
    console.log(`  ⏭️  Column exists: ${table}.${column}`);
  }
}

console.log('\n🚀 Running advanced feature migration...\n');

// ── 1. Elections: Sandbox Mode + Phase ──────────────────────────────────
await addColumnIfMissing('elections', 'is_sandbox', "TINYINT(1) NOT NULL DEFAULT 0");
await addColumnIfMissing('elections', 'phase', "ENUM('registration','nomination','campaign','voting','closed','published') NOT NULL DEFAULT 'voting'");

// ── 2. Candidates: Rich Profile Data ────────────────────────────────────
await addColumnIfMissing('candidates', 'manifesto',    'TEXT');
await addColumnIfMissing('candidates', 'department',   'VARCHAR(100)');
await addColumnIfMissing('candidates', 'year',         'VARCHAR(20)');
await addColumnIfMissing('candidates', 'achievements', 'JSON');

// ── 3. Activity Feed Table ───────────────────────────────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS activity_feed (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    election_id INT NOT NULL,
    message     VARCHAR(500) NOT NULL,
    event_type  ENUM('info','milestone','warning') DEFAULT 'info',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
  )
`);
console.log('  ✅ Table: activity_feed');

// ── 4. Voter Badges Table ────────────────────────────────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS voter_badges (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    voter_id    INT NOT NULL,
    badge_key   VARCHAR(50) NOT NULL,
    election_id INT,
    awarded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_voter_badge (voter_id, badge_key, election_id),
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('  ✅ Table: voter_badges');

// ── 5. Seed candidate rich data ──────────────────────────────────────────
await conn.query(`
  UPDATE candidates SET
    manifesto   = 'I pledge to modernize our student council by launching a digital feedback platform, reducing exam stress through structured wellness programs, and creating interdepartmental collaboration projects. Every student deserves a voice, and I will ensure that voice is heard at every faculty meeting.',
    department  = 'Computer Science',
    year        = '3rd Year',
    achievements = '["bi-trophy-fill","bi-code-slash","bi-mortarboard-fill"]'
  WHERE id = 1 AND (department IS NULL OR department = '')
`);

await conn.query(`
  UPDATE candidates SET
    manifesto   = 'My focus is unity — bringing together students from all departments. I will establish a peer mentorship program, negotiate better library hours, create a sustainable campus initiative, and host monthly open town halls where students can directly address admin concerns.',
    department  = 'Information Technology',
    year        = '2nd Year',
    achievements = '["bi-people-fill","bi-heart-fill","bi-globe"]'
  WHERE id = 2 AND (department IS NULL OR department = '')
`);
console.log('  ✅ Seeded: candidate rich profiles');

// ── 6. Seed activity feed ────────────────────────────────────────────────
const [feedCheck] = await conn.query('SELECT COUNT(*) as c FROM activity_feed WHERE election_id = 1');
if (feedCheck[0].c === 0) {
  await conn.query(`
    INSERT INTO activity_feed (election_id, message, event_type) VALUES
      (1, 'Election officially launched — voting is now open!', 'info'),
      (1, 'First 10 ballots have been submitted.', 'milestone'),
      (1, 'Voting is progressing well. Stay engaged!', 'info')
  `);
  console.log('  ✅ Seeded: activity_feed');
}

// ── 7. Set election phases ───────────────────────────────────────────────
await conn.query(`UPDATE elections SET phase = 'voting'    WHERE status = 'active'    AND phase = 'voting'`);
await conn.query(`UPDATE elections SET phase = 'nomination' WHERE status = 'upcoming' AND phase = 'voting'`);
await conn.query(`UPDATE elections SET phase = 'published'  WHERE status = 'completed' AND phase = 'voting'`);
console.log('  ✅ Updated: election phases');

await conn.end();
console.log('\n✨ Advanced migration complete!\n');

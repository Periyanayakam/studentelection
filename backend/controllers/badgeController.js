import pool from '../config/db.js';

// Badge definitions catalogue
const BADGE_CATALOGUE = {
  early_voter:    { key: 'early_voter',    icon: 'bi-lightning-charge-fill', label: 'Early Voter',       color: '#f59e0b', description: 'Voted within the first 10% of ballots cast.' },
  on_time_voter:  { key: 'on_time_voter',  icon: 'bi-clock-fill',           label: 'On-Time Voter',     color: '#10b981', description: 'Cast your ballot before the election closed.' },
  active_participant: { key: 'active_participant', icon: 'bi-star-fill', label: 'Active Participant', color: '#6366f1', description: 'Participated in multiple elections.' },
  first_vote:     { key: 'first_vote',     icon: 'bi-award-fill',           label: 'First Ballot',      color: '#ec4899', description: 'Cast your very first vote on ElectVote.' },
};

// Get all badges for the current logged-in voter
export const getMyBadges = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT vb.badge_key, vb.election_id, vb.awarded_at, e.title as election_title
       FROM voter_badges vb
       LEFT JOIN elections e ON vb.election_id = e.id
       WHERE vb.voter_id = ?
       ORDER BY vb.awarded_at DESC`,
      [req.user.id]
    );

    const badges = rows.map(row => ({
      ...row,
      ...(BADGE_CATALOGUE[row.badge_key] || { label: row.badge_key, icon: 'bi-patch-check-fill', color: '#64748b' })
    }));

    return res.json({ success: true, badges });
  } catch (error) {
    console.error('Get Badges Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching badges' });
  }
};

// Get badge catalogue definitions
export const getBadgeCatalogue = async (req, res) => {
  return res.json({ success: true, badges: Object.values(BADGE_CATALOGUE) });
};

// Internal helper: award a badge (idempotent — won't duplicate)
export const awardBadge = async (voter_id, badge_key, election_id = null) => {
  try {
    await pool.query(
      `INSERT IGNORE INTO voter_badges (voter_id, badge_key, election_id) VALUES (?, ?, ?)`,
      [voter_id, badge_key, election_id]
    );
  } catch (err) {
    console.error('Award Badge Error:', err);
  }
};

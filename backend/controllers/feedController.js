import pool from '../config/db.js';

// Get latest activity feed events for an election (no voter identity exposed)
export const getFeed = async (req, res) => {
  const { election_id } = req.query;
  if (!election_id) {
    return res.status(400).json({ success: false, message: 'election_id is required' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, message, event_type, created_at 
       FROM activity_feed 
       WHERE election_id = ? 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [election_id]
    );
    return res.json({ success: true, feed: rows });
  } catch (error) {
    console.error('Get Feed Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching activity feed' });
  }
};

// Internal helper: post a feed event (called from other controllers)
export const postFeedEvent = async (election_id, message, event_type = 'info') => {
  try {
    await pool.query(
      'INSERT INTO activity_feed (election_id, message, event_type) VALUES (?, ?, ?)',
      [election_id, message, event_type]
    );
  } catch (err) {
    console.error('Feed Post Error:', err);
  }
};

// Get all feed events across all elections (admin view)
export const getAllFeedEvents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT af.id, af.election_id, e.title as election_title, af.message, af.event_type, af.created_at
       FROM activity_feed af
       JOIN elections e ON af.election_id = e.id
       ORDER BY af.created_at DESC
       LIMIT 50`
    );
    return res.json({ success: true, feed: rows });
  } catch (error) {
    console.error('Get All Feed Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching feed' });
  }
};

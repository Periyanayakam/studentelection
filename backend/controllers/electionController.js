import pool from '../config/db.js';

// Get all elections (includes sandbox flag, phase)
export const getElections = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, description, start_date, end_date, status, is_sandbox, phase 
       FROM elections ORDER BY start_date DESC`
    );
    return res.json({ success: true, elections: rows });
  } catch (error) {
    console.error('Get Elections Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred fetching elections' });
  }
};

// Get completed elections for the archive page
export const getArchive = async (req, res) => {
  try {
    const [elections] = await pool.query(
      `SELECT e.id, e.title, e.description, e.start_date, e.end_date, e.status, e.is_sandbox,
              COUNT(DISTINCT v.id) as total_votes,
              COUNT(DISTINCT c.id) as candidate_count
       FROM elections e
       LEFT JOIN votes v ON v.election_id = e.id
       LEFT JOIN candidates c ON c.election_id = e.id
       WHERE e.status = 'completed' AND e.is_sandbox = 0
       GROUP BY e.id
       ORDER BY e.end_date DESC`
    );

    // For each completed election, find the winner
    const archive = await Promise.all(elections.map(async (el) => {
      const [winner] = await pool.query(
        `SELECT c.name, c.party, COUNT(v.id) as votes
         FROM votes v JOIN candidates c ON v.candidate_id = c.id
         WHERE v.election_id = ? GROUP BY c.id ORDER BY votes DESC LIMIT 1`,
        [el.id]
      );
      return { ...el, winner: winner[0] || null };
    }));

    return res.json({ success: true, archive });
  } catch (error) {
    console.error('Get Archive Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching election archive' });
  }
};

// Create a new election (Admin only)
export const createElection = async (req, res) => {
  const { title, description, start_date, end_date, status, is_sandbox, phase } = req.body || {};

  if (!title || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Title, start date, and end date are required' });
  }

  const normalizedStatus   = status    || 'upcoming';
  const normalizedSandbox  = is_sandbox ? 1 : 0;
  const normalizedPhase    = phase     || 'nomination';

  try {
    const [result] = await pool.query(
      `INSERT INTO elections (title, description, start_date, end_date, status, is_sandbox, phase) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description?.trim() || null, start_date, end_date, normalizedStatus, normalizedSandbox, normalizedPhase]
    );

    return res.status(201).json({
      success: true,
      message: 'Election created successfully!',
      election: { id: result.insertId, title, description, start_date, end_date, status: normalizedStatus, is_sandbox: normalizedSandbox, phase: normalizedPhase }
    });
  } catch (error) {
    console.error('Create Election Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred creating the election' });
  }
};

// Update an election (Admin only)
export const updateElection = async (req, res) => {
  const { id } = req.params;
  const { title, description, start_date, end_date, status, is_sandbox, phase } = req.body || {};

  if (!title || !start_date || !end_date || !status) {
    return res.status(400).json({ success: false, message: 'Title, start date, end date, and status are required' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM elections WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    await pool.query(
      `UPDATE elections SET title=?, description=?, start_date=?, end_date=?, status=?, is_sandbox=?, phase=? WHERE id=?`,
      [title.trim(), description?.trim() || null, start_date, end_date, status, is_sandbox ? 1 : 0, phase || 'voting', id]
    );

    return res.json({ success: true, message: 'Election updated successfully!' });
  } catch (error) {
    console.error('Update Election Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred updating the election' });
  }
};

// Delete an election (Admin only)
export const deleteElection = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT id FROM elections WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }
    await pool.query('DELETE FROM elections WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Election deleted successfully!' });
  } catch (error) {
    console.error('Delete Election Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred deleting the election' });
  }
};

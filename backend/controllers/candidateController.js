import pool from '../config/db.js';

// Get candidates — optionally filter by election_id, supports compare mode (ids)
export const getCandidates = async (req, res) => {
  const { election_id, ids } = req.query;

  try {
    let query = `SELECT c.*, e.title as election_title 
                 FROM candidates c JOIN elections e ON c.election_id = e.id`;
    const params = [];

    if (ids) {
      // compare mode: comma-separated list of candidate ids
      const idList = ids.split(',').map(Number).filter(Boolean);
      if (idList.length === 0) return res.json({ success: true, candidates: [] });
      query += ` WHERE c.id IN (${idList.map(() => '?').join(',')})`;
      params.push(...idList);
    } else if (election_id) {
      query += ' WHERE c.election_id = ?';
      params.push(election_id);
    }

    query += ' ORDER BY c.id ASC';
    const [rows] = await pool.query(query, params);

    // Parse achievements JSON safely
    const candidates = rows.map(row => ({
      ...row,
      achievements: (() => {
        try { return typeof row.achievements === 'string' ? JSON.parse(row.achievements) : (row.achievements || []); }
        catch { return []; }
      })()
    }));

    return res.json({ success: true, candidates });
  } catch (error) {
    console.error('Get Candidates Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred fetching candidates' });
  }
};

// Create a candidate (Admin only)
export const createCandidate = async (req, res) => {
  const { election_id, name, party, symbol, photo, manifesto, department, year, achievements } = req.body || {};

  if (!election_id || !name || !party) {
    return res.status(400).json({ success: false, message: 'Election ID, name, and party are required' });
  }

  try {
    const [election] = await pool.query('SELECT id FROM elections WHERE id = ?', [election_id]);
    if (election.length === 0) {
      return res.status(404).json({ success: false, message: 'Specified election does not exist' });
    }

    const achievementsJson = achievements ? JSON.stringify(achievements) : null;

    const [result] = await pool.query(
      `INSERT INTO candidates (election_id, name, party, symbol, photo, manifesto, department, year, achievements) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        election_id,
        name.trim(),
        party.trim(),
        symbol?.trim() || null,
        photo?.trim() || null,
        manifesto?.trim() || null,
        department?.trim() || null,
        year?.trim() || null,
        achievementsJson
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Candidate added successfully!',
      candidate: { id: result.insertId, election_id, name, party, symbol, photo, manifesto, department, year, achievements }
    });
  } catch (error) {
    console.error('Create Candidate Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred adding the candidate' });
  }
};

// Update candidate details (Admin only)
export const updateCandidate = async (req, res) => {
  const { id } = req.params;
  const { election_id, name, party, symbol, photo, manifesto, department, year, achievements } = req.body || {};

  if (!election_id || !name || !party) {
    return res.status(400).json({ success: false, message: 'Election ID, name, and party are required' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM candidates WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const [election] = await pool.query('SELECT id FROM elections WHERE id = ?', [election_id]);
    if (election.length === 0) {
      return res.status(404).json({ success: false, message: 'Specified election does not exist' });
    }

    const achievementsJson = achievements ? JSON.stringify(achievements) : null;

    await pool.query(
      `UPDATE candidates SET election_id=?, name=?, party=?, symbol=?, photo=?, manifesto=?, department=?, year=?, achievements=? WHERE id=?`,
      [election_id, name.trim(), party.trim(), symbol?.trim() || null, photo?.trim() || null,
       manifesto?.trim() || null, department?.trim() || null, year?.trim() || null, achievementsJson, id]
    );

    return res.json({ success: true, message: 'Candidate updated successfully!' });
  } catch (error) {
    console.error('Update Candidate Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred updating candidate' });
  }
};

// Delete a candidate (Admin only)
export const deleteCandidate = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT id FROM candidates WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    await pool.query('DELETE FROM candidates WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Candidate deleted successfully!' });
  } catch (error) {
    console.error('Delete Candidate Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred deleting candidate' });
  }
};

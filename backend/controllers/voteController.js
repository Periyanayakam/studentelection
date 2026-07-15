import pool from '../config/db.js';
import { postFeedEvent } from './feedController.js';
import { awardBadge } from './badgeController.js';

// Cast a Vote (Voter only)
export const castVote = async (req, res) => {
  const { election_id, candidate_id } = req.body || {};
  const voter_id = req.user.id;

  if (!election_id || !candidate_id) {
    return res.status(400).json({ success: false, message: 'Election ID and Candidate ID are required' });
  }

  try {
    // 1. Verify Election status (must be active)
    const [elections] = await pool.query('SELECT status, is_sandbox FROM elections WHERE id = ?', [election_id]);
    if (elections.length === 0) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    const election = elections[0];
    if (election.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Voting is only allowed for active elections' });
    }

    // 2. Verify Candidate belongs to this election
    const [candidates] = await pool.query('SELECT id FROM candidates WHERE id = ? AND election_id = ?', [candidate_id, election_id]);
    if (candidates.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected candidate does not belong to this election' });
    }

    // 3. Check duplicate vote
    const [existingVote] = await pool.query(
      'SELECT id FROM votes WHERE voter_id = ? AND election_id = ?',
      [voter_id, election_id]
    );
    if (existingVote.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already casted a vote in this election' });
    }

    // 4. Record Vote using transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'INSERT INTO votes (voter_id, candidate_id, election_id) VALUES (?, ?, ?)',
        [voter_id, candidate_id, election_id]
      );
      await connection.commit();
      connection.release();
    } catch (txError) {
      await connection.rollback();
      connection.release();
      throw txError;
    }

    // 5. Post-vote actions (non-blocking — don't fail vote if these fail)
    try {
      const [voteCount] = await pool.query('SELECT COUNT(*) as c FROM votes WHERE election_id = ?', [election_id]);
      const count = voteCount[0].c;

      // Activity feed milestones
      if (count === 1)   await postFeedEvent(election_id, `🗳️ First vote has been cast! The election is underway.`, 'milestone');
      if (count === 10)  await postFeedEvent(election_id, `🎉 10 ballots submitted — voters are participating actively!`, 'milestone');
      if (count === 25)  await postFeedEvent(election_id, `📊 25 votes recorded. Turnout is growing!`, 'milestone');
      if (count === 50)  await postFeedEvent(election_id, `🔥 50 ballots cast! Great voter engagement!`, 'milestone');
      if (count === 100) await postFeedEvent(election_id, `🏆 100 votes milestone reached! This election is highly contested.`, 'milestone');
      else if (count % 50 === 0) await postFeedEvent(election_id, `📈 ${count} votes have been cast in this election.`, 'info');

      // Award badges
      // First vote ever for this voter?
      const [totalVoterVotes] = await pool.query('SELECT COUNT(*) as c FROM votes WHERE voter_id = ?', [voter_id]);
      if (totalVoterVotes[0].c === 1) await awardBadge(voter_id, 'first_vote', election_id);

      // Early voter (first 10% of total candidates * expected 10 votes per candidate)
      const [candCount] = await pool.query('SELECT COUNT(*) as c FROM candidates WHERE election_id = ?', [election_id]);
      const earlyThreshold = Math.max(5, candCount[0].c * 5);
      if (count <= earlyThreshold) await awardBadge(voter_id, 'early_voter', election_id);

      // On-time voter (voted in any active election)
      await awardBadge(voter_id, 'on_time_voter', election_id);

      // Active participant (voted in 2+ elections)
      const [multiElectionVotes] = await pool.query('SELECT COUNT(DISTINCT election_id) as c FROM votes WHERE voter_id = ?', [voter_id]);
      if (multiElectionVotes[0].c >= 2) await awardBadge(voter_id, 'active_participant', null);

    } catch (postErr) {
      console.error('Post-vote actions error (non-fatal):', postErr.message);
    }

    return res.status(201).json({
      success: true,
      message: election.is_sandbox
        ? '✅ Practice vote recorded! This was a sandbox election — no real results were affected.'
        : '🗳️ Vote cast successfully! Thank you for participating.'
    });

  } catch (error) {
    console.error('Cast Vote Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Duplicate vote detected. You can only vote once.' });
    }
    return res.status(500).json({ success: false, message: 'An error occurred while recording your vote' });
  }
};

// Get Election Results
export const getResults = async (req, res) => {
  const { election_id } = req.query;

  if (!election_id) {
    try {
      const [elections] = await pool.query(
        'SELECT e.*, COUNT(v.id) as total_votes FROM elections e LEFT JOIN votes v ON e.id = v.election_id GROUP BY e.id ORDER BY e.end_date DESC'
      );
      return res.json({ success: true, elections });
    } catch (error) {
      console.error('Get Results Summary Error:', error);
      return res.status(500).json({ success: false, message: 'An error occurred fetching results summary' });
    }
  }

  try {
    const [elections] = await pool.query('SELECT * FROM elections WHERE id = ?', [election_id]);
    if (elections.length === 0) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }
    const election = elections[0];

    const [voteCountRows] = await pool.query('SELECT COUNT(*) as count FROM votes WHERE election_id = ?', [election_id]);
    const totalVotes = voteCountRows[0].count;

    const [candidates] = await pool.query(
      `SELECT c.id, c.name, c.party, c.symbol, c.photo, c.department, c.year, c.achievements,
              COUNT(v.id) as vote_count
       FROM candidates c
       LEFT JOIN votes v ON c.id = v.candidate_id
       WHERE c.election_id = ?
       GROUP BY c.id
       ORDER BY vote_count DESC`,
      [election_id]
    );

    const results = candidates.map(c => {
      const vote_count = parseInt(c.vote_count, 10);
      const percentage = totalVotes > 0 ? ((vote_count / totalVotes) * 100).toFixed(1) : '0.0';
      return {
        ...c,
        achievements: (() => {
          try { return typeof c.achievements === 'string' ? JSON.parse(c.achievements) : (c.achievements || []); }
          catch { return []; }
        })(),
        vote_count,
        percentage: parseFloat(percentage)
      };
    });

    return res.json({ success: true, election, totalVotes, results });
  } catch (error) {
    console.error('Get Election Results Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred fetching election results' });
  }
};

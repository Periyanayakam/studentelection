import pool from '../config/db.js';

// Get Admin Dashboard Stats & User Registry
export const getAdminDashboard = async (req, res) => {
  try {
    // 1. Total Registered Voters count
    const [votersCount] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'voter'");
    
    // 2. Total Elections count
    const [electionsCount] = await pool.query("SELECT COUNT(*) as count FROM elections");

    // 3. Total Candidates count
    const [candidatesCount] = await pool.query("SELECT COUNT(*) as count FROM candidates");

    // 4. Total Votes Cast count
    const [votesCount] = await pool.query("SELECT COUNT(*) as count FROM votes");

    // 5. Get List of Registered Users
    const [usersList] = await pool.query(
      "SELECT id, fullname, email, phone, role, created_at FROM users ORDER BY created_at DESC"
    );

    // 6. Get Recent Votes overview
    const [recentVotes] = await pool.query(
      `SELECT v.id, u.fullname as voter_name, c.name as candidate_name, e.title as election_title, v.voted_at 
       FROM votes v 
       JOIN users u ON v.voter_id = u.id 
       JOIN candidates c ON v.candidate_id = c.id 
       JOIN elections e ON v.election_id = e.id 
       ORDER BY v.voted_at DESC LIMIT 5`
    );

    return res.json({
      success: true,
      stats: {
        totalVoters: votersCount[0].count,
        totalElections: electionsCount[0].count,
        totalCandidates: candidatesCount[0].count,
        totalVotes: votesCount[0].count
      },
      users: usersList,
      recentVotes: recentVotes
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred fetching dashboard statistics' });
  }
};

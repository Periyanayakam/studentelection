import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { getElections, createElection, updateElection, deleteElection, getArchive } from '../controllers/electionController.js';
import { getCandidates, createCandidate, updateCandidate, deleteCandidate } from '../controllers/candidateController.js';
import { castVote, getResults } from '../controllers/voteController.js';
import { getAdminDashboard } from '../controllers/adminController.js';
import { getFeed, getAllFeedEvents } from '../controllers/feedController.js';
import { getMyBadges, getBadgeCatalogue } from '../controllers/badgeController.js';
import { authenticateJWT, isAdmin, isVoter } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Authentication ──────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/auth/register', register); // backward compatibility
router.post('/auth/login', login);       // backward compatibility

// ── Profile (JWT Protected) ─────────────────────────────────────────────
router.get('/profile',  authenticateJWT, getProfile);
router.put('/profile',  authenticateJWT, updateProfile);

// ── Elections (JWT Protected) ───────────────────────────────────────────
router.get('/elections',      authenticateJWT, getElections);
router.post('/elections',     authenticateJWT, isAdmin, createElection);
router.put('/elections/:id',  authenticateJWT, isAdmin, updateElection);
router.delete('/elections/:id', authenticateJWT, isAdmin, deleteElection);

// ── Election Archive (completed elections) ──────────────────────────────
router.get('/archive',  authenticateJWT, getArchive);

// ── Candidates (JWT Protected) ──────────────────────────────────────────
router.get('/candidates',      authenticateJWT, getCandidates);   // supports ?election_id=X and ?ids=1,2
router.post('/candidates',     authenticateJWT, isAdmin, createCandidate);
router.put('/candidates/:id',  authenticateJWT, isAdmin, updateCandidate);
router.delete('/candidates/:id', authenticateJWT, isAdmin, deleteCandidate);

// ── Voting ──────────────────────────────────────────────────────────────
router.post('/vote',      authenticateJWT, isVoter, castVote);
router.get('/results',    authenticateJWT, getResults);

// ── My Votes (which elections has this voter already voted in) ──────────
router.get('/my-votes', authenticateJWT, async (req, res) => {
  try {
    const [rows] = await (await import('../config/db.js')).default.query(
      'SELECT DISTINCT election_id FROM votes WHERE voter_id = ?',
      [req.user.id]
    );
    return res.json({ success: true, voted_election_ids: rows.map(r => r.election_id) });
  } catch (err) {
    return res.status(500).json({ success: false, voted_election_ids: [] });
  }
});

// ── Activity Feed ───────────────────────────────────────────────────────
router.get('/feed',           authenticateJWT, getFeed);          // ?election_id=X
router.get('/feed/all',       authenticateJWT, isAdmin, getAllFeedEvents);

// ── Achievement Badges ──────────────────────────────────────────────────
router.get('/my-badges',      authenticateJWT, getMyBadges);
router.get('/badges/catalogue', authenticateJWT, getBadgeCatalogue);

// ── Admin Dashboard Stats ───────────────────────────────────────────────
router.get('/admin/dashboard', authenticateJWT, isAdmin, getAdminDashboard);

export default router;

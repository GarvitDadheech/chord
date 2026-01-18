import { Router } from 'express';
import { matchController } from '../controllers/matchController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/today', (req, res) => matchController.getTodayMatch(req, res));
router.get('/history', (req, res) => matchController.getMatchHistory(req, res));
router.post('/:matchId/report', (req, res) => matchController.reportMatch(req, res));
router.post('/:matchId/block', (req, res) => matchController.blockUser(req, res));

export default router;


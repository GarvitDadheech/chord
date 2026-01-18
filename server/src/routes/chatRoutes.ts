import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/:matchId/messages', (req, res) => chatController.getMessages(req, res));
router.post('/:matchId/messages', (req, res) => chatController.sendMessage(req, res));
router.post('/:matchId/reveal-request', (req, res) => chatController.requestReveal(req, res));
router.post('/:matchId/reveal-accept', (req, res) => chatController.acceptReveal(req, res));

export default router;


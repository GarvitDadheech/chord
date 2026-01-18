import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/me', (req, res) => userController.getCurrentUser(req, res));
router.put('/me', (req, res) => userController.updateProfile(req, res));
router.post('/me/location', (req, res) => userController.updateLocation(req, res));
router.get('/me/music-taste', (req, res) => userController.getMusicTaste(req, res));
router.post('/me/sync-spotify', (req, res) => userController.syncSpotify(req, res));

export default router;


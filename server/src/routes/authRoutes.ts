import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

router.get('/spotify/authorize', (req, res) =>
  authController.getAuthorizationUrl(req, res)
);
router.get('/spotify/callback', (req, res) =>
  authController.handleCallback(req, res)
);
router.post('/refresh', (req, res) => authController.refreshToken(req, res));

export default router;


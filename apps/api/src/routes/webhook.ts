import express from 'express';
import { verifyWebhook, handleWebhook, handleWABBWebhook } from '../controllers/webhook';

const router = express.Router();

// GET /webhook - Webhook verification
router.get('/webhook', verifyWebhook);

// POST /webhook - Handle incoming messages
router.post('/webhook', handleWebhook);

// POST /wabb-webhook - Handle WABB.in automation webhook
router.post('/wabb-webhook', handleWABBWebhook);

export default router;

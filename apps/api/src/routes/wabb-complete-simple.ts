import express from 'express';

const router = express.Router();

// Simple test endpoint to verify route mounting works
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'WABB Complete route is accessible',
    timestamp: new Date().toISOString()
  });
});

export default router;

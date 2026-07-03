import express, { Request, Response } from 'express';
const router = express.Router();

// Import the test function
const { testClaudeAPIOnAzure } = require('../../test-claude-azure');

// Test endpoint to run Claude API diagnostics
router.get('/claude-debug', async (req: Request, res: Response) => {
    console.log('\n=== CLAUDE API DEBUG ENDPOINT CALLED ===');
    
    try {
        // Capture console output
        const originalLog = console.log;
        const logs: string[] = [];
        
        console.log = (...args: any[]) => {
            const message = args.join(' ');
            logs.push(message);
            originalLog(message);
        };
        
        // Run the test
        await testClaudeAPIOnAzure();
        
        // Restore console.log
        console.log = originalLog;
        
        res.json({
            success: true,
            message: 'Claude API test completed',
            logs: logs,
            timestamp: new Date().toISOString()
        });
        
    } catch (error: any) {
        console.error('Claude API test failed:', error);
        
        res.status(500).json({
            success: false,
            message: 'Claude API test failed',
            error: error?.message || 'Unknown error',
            stack: error?.stack || 'No stack trace',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;

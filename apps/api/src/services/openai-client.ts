import axios from 'axios';
import { sanitizeForLog } from '../utils/safe-logging';

export const requireOpenAIKey = (serviceName: string): string => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(`OPENAI_API_KEY is required for ${serviceName}`);
  }
  return key;
};

export const openAIHeaders = (serviceName: string) => ({
  Authorization: `Bearer ${requireOpenAIKey(serviceName)}`,
  'Content-Type': 'application/json'
});

export const checkOpenAIHealth = async (): Promise<void> => {
  try {
    await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.OPENAI_APPLICATION_TAILORING_MODEL || process.env.OPENAI_RESUME_MODEL || 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'ping' }]
    }, {
      timeout: 15000,
      headers: openAIHeaders('OpenAI chat health check')
    });
    console.log('✅ OpenAI dependency connected for LLM features');
  } catch (error) {
    console.error('❌ OpenAI dependency failed. Check OPENAI_API_KEY and model access:', sanitizeForLog(error));
    throw error;
  }
};

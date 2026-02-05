import express from 'express';
import telegramService from '../services/telegramService';

const router = express.Router();

// Car bot webhook endpoint
router.post('/car', express.json(), async (req, res) => {
  try {
    const bot = (telegramService as any).carBot;
    if (bot) {
      await bot.processUpdate(req.body);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Car webhook error:', error);
    res.sendStatus(500);
  }
});

// Debt bot webhook endpoint
router.post('/debt', express.json(), async (req, res) => {
  try {
    const bot = (telegramService as any).debtBot;
    if (bot) {
      await bot.processUpdate(req.body);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Debt webhook error:', error);
    res.sendStatus(500);
  }
});

export default router;

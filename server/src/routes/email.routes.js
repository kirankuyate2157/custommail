import express from 'express';
const router = express.Router();
import { sendEmail, getThread } from '../controllers/email.controller';

router.post('/send', sendEmail);
router.get('/thread', getThread);

module.exports = router;

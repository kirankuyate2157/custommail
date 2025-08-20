const express = require('express');
const router = express.Router();
const { sendEmail, getThread } = require('../controllers/email.controller');

router.post('/send', sendEmail);
router.get('/thread', getThread);

module.exports = router;

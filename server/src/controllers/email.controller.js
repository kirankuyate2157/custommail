import emailService from '../services/email.service.js';

async function sendEmail(req, res) {
    try {
        const { userId, recipientEmail, subject, body, followUpDueAt } = req.body;
        if (!userId || !recipientEmail || !subject || !body) {
            return res.status(400).json({ error: 'missing fields' });
        }
        const email = await emailService.createAndSendEmail({
            userId,
            recipientEmail,
            subject,
            body,
            followUpDueAt,
        });
        res.json({ ok: true, email });
    } catch (err) {
        console.error('sendEmail error', err);
        res.status(500).json({ error: 'internal error' });
    }
}

async function getThread(req, res) {
    try {
        const { userId, recipientEmail } = req.query;
        if (!userId || !recipientEmail) {
            return res.status(400).json({ error: 'missing query params' });
        }
        const thread = await emailService.getThread(userId, recipientEmail);
        res.json({ ok: true, thread });
    } catch (err) {
        console.error('getThread error', err);
        res.status(500).json({ error: 'internal error' });
    }
}

export default { sendEmail, getThread };

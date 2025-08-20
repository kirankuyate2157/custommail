
import { emailRepo } from '../config';
import { uuidv4 } from 'uuid';

async function createAndSendEmail({ userId, recipientEmail, subject, body, followUpDueAt }) {
    const email = {
        id: uuidv4(),
        userId,
        recipientEmail,
        subject,
        body,
        status: 'sent',
        createdAt: new Date(),
        sentAt: new Date(),
        followUpDueAt: followUpDueAt || null,
    };
    await emailRepo.createEmail(email);
    // later: enqueue Gmail send job, follow-up scheduling, etc.
    return email;
}

async function getThread(userId, recipientEmail) {
    return emailRepo.listByRecipient(userId, recipientEmail, { limit: 50 });
}

module.exports = {
    createAndSendEmail,
    getThread,
};

const { getDb } = require('./client');

async function createEmail(email) {
  const db = await getDb();
  await db.collection('emails').insertOne(email);
}

async function getEmailById(userId, emailId) {
  const db = await getDb();
  return db.collection('emails').findOne({ userId, id: emailId });
}

async function listByRecipient(userId, recipientEmail, { limit = 20 } = {}) {
  const db = await getDb();
  return db
    .collection('emails')
    .find({ userId, recipientEmail })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

async function updateStatus(userId, emailId, status) {
  const db = await getDb();
  await db
    .collection('emails')
    .updateOne({ userId, id: emailId }, { $set: { status } });
}

async function listPendingFollowUps(userId, asOf) {
  const db = await getDb();
  return db
    .collection('emails')
    .find({
      userId,
      followUpDueAt: { $lte: asOf },
      status: { $ne: 'follow_up' },
    })
    .sort({ followUpDueAt: 1 })
    .toArray();
}

module.exports = {
  createEmail,
  getEmailById,
  listByRecipient,
  updateStatus,
  listPendingFollowUps,
};

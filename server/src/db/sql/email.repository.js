const { pool } = require('./pool');

async function createEmail(email) {
  await pool.query(
    `INSERT INTO emails 
      (id, user_id, recipient_email, subject, body, status, sent_at, follow_up_due_at, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      email.id,
      email.userId,
      email.recipientEmail,
      email.subject,
      email.body,
      email.status,
      email.sentAt || null,
      email.followUpDueAt || null,
      email.createdAt,
    ]
  );
}

async function getEmailById(userId, emailId) {
  const res = await pool.query(
    'SELECT * FROM emails WHERE id=$1 AND user_id=$2 LIMIT 1',
    [emailId, userId]
  );
  return res.rows[0] || null;
}

async function listByRecipient(userId, recipientEmail, { limit = 20, offset = 0 } = {}) {
  const res = await pool.query(
    `SELECT * FROM emails 
     WHERE user_id=$1 AND recipient_email=$2 
     ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
    [userId, recipientEmail, limit, offset]
  );
  return res.rows;
}

async function updateStatus(userId, emailId, status) {
  await pool.query(
    `UPDATE emails SET status=$1 WHERE id=$2 AND user_id=$3`,
    [status, emailId, userId]
  );
}

async function listPendingFollowUps(userId, asOf) {
  const res = await pool.query(
    `SELECT * FROM emails 
     WHERE user_id=$1 AND follow_up_due_at <= $2 AND status != 'follow_up'
     ORDER BY follow_up_due_at ASC`,
    [userId, asOf]
  );
  return res.rows;
}

module.exports = {
  createEmail,
  getEmailById,
  listByRecipient,
  updateStatus,
  listPendingFollowUps,
};

import dotenv from 'dotenv';
dotenv.config();

const DB_KIND = process.env.DB_KIND || 'mongodb'; // 'mongodb' or 'sql'

let emailRepo;
if (DB_KIND === 'mongodb') {
  emailRepo = require('../db/mongodb/email.repository');
} else if (DB_KIND === 'sql') {
  emailRepo = require('../db/sql/email.repository');
} else {
  throw new Error('Unsupported DB_KIND: ' + DB_KIND);
}

export default{ emailRepo };

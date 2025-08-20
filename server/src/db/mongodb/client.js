const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useUnifiedTopology: true,
});

let dbInstance;
async function getDb() {
  if (!dbInstance) {
    await client.connect();
    dbInstance = client.db(); // or specify .db('yourdbname')
  }
  return dbInstance;
}

module.exports = { getDb };

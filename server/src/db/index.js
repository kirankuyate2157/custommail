import { connectMongo } from './mongo/index.js';
import { connectSQL } from './sql/index.js';

let dbType = process.env.DB_TYPE || "mongo"; // "mongo" or "sql"

let dbClient;

if (dbType === "mongo") {
  dbClient = await connectMongo();
} else if (dbType === "sql") {
  dbClient = await connectSQL();
}

export default dbClient;

import mysql from "mysql2/promise";
import * as userQueries from "./queries/userQueries.js";
import * as emailQueries from "./queries/emailQueries.js";

let connection;

export async function connectSQL() {
  connection = await mysql.createConnection({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    database: process.env.SQL_DB,
  });

  console.log("SQL DB connected");

  return {
    users: userQueries(connection),
    emails: emailQueries(connection),
  };
}

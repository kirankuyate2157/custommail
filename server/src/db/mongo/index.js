import mongoose from "mongoose";
import * as userQueries from "./queries/userQueries.js";
import * as emailQueries from "./queries/emailQueries.js";

export async function connectMongo() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log("MongoDB connected");

  return {
    users: userQueries,
    emails: emailQueries,
  };
}

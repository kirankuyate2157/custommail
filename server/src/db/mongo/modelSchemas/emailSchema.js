import mongoose from "mongoose";

const emailSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: [{ type: String, required: true }],
  subject: { type: String },
  body: { type: String },
  sent_at: { type: Date, default: Date.now },
});

export default mongoose.model("Email", emailSchema);

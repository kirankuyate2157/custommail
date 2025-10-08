import User from "../schemas/userSchema.js";

export async function createUser({ name, email }) {
  const user = new User({ name, email });
  await user.save();
  return user._id;
}

export async function getUserById(id) {
  return User.findById(id);
}

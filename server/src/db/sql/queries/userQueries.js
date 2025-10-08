export default (connection) => ({
  async createUser({ name, email }) {
    const [result] = await connection.execute(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    );
    return result.insertId;
  },

  async getUserById(id) {
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }
});

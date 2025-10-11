// user repository
import { rawQuery } from "../config/db";

export const findAllUsers = async () => {
    return await rawQuery("SELECT * FROM users");
};

export const insertUser = async (data: any) => {
    const { name, email, password } = data;
    return await rawQuery(
        "INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING *",
        [name, email, password]
    );
};

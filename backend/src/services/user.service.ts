// user service
import * as userRepo from "../repositories/user.repository";

export const getAllUsers = async () => {
    return await userRepo.findAllUsers();
};

export const createUser = async (data: any) => {
    return await userRepo.insertUser(data);
};

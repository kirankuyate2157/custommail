// db.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const rawQuery = async (query: string, params?: any[]) => {
    return await prisma.$queryRawUnsafe(query, ...(params || []));
};

export default prisma;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
/**
 * Instantiates a single instance PrismaClient and save it on the global object.
 * @link https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */
const client_1 = require("@prisma/client");
const prismaGlobal = global;
exports.prisma = prismaGlobal.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    prismaGlobal.prisma = exports.prisma;
}

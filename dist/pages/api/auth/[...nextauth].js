"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOptions = void 0;
const next_auth_1 = __importDefault(require("next-auth"));
const google_1 = __importDefault(require("next-auth/providers/google"));
const prisma_adapter_1 = require("@next-auth/prisma-adapter");
const client_1 = __importDefault(require("../../../utils/client"));
exports.authOptions = {
    adapter: (0, prisma_adapter_1.PrismaAdapter)(client_1.default),
    providers: [
        (0, google_1.default)({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    // Include user.id on session
    callbacks: {
        session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
exports.default = (0, next_auth_1.default)(exports.authOptions);

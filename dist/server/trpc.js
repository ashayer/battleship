"use strict";
/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v10/router
 * @see https://trpc.io/docs/v10/procedures
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authedProcedure = exports.mergeRouters = exports.middleware = exports.publicProcedure = exports.router = void 0;
const server_1 = require("@trpc/server");
const superjson_1 = __importDefault(require("superjson"));
const t = server_1.initTRPC.context().create({
    /**
     * @see https://trpc.io/docs/v10/data-transformers
     */
    transformer: superjson_1.default,
    /**
     * @see https://trpc.io/docs/v10/error-formatting
     */
    errorFormatter({ shape }) {
        return shape;
    },
});
/**
 * Create a router
 * @see https://trpc.io/docs/v10/router
 */
exports.router = t.router;
/**
 * Create an unprotected procedure
 * @see https://trpc.io/docs/v10/procedures
 **/
exports.publicProcedure = t.procedure;
/**
 * @see https://trpc.io/docs/v10/middlewares
 */
exports.middleware = t.middleware;
/**
 * @see https://trpc.io/docs/v10/merging-routers
 */
exports.mergeRouters = t.mergeRouters;
const isAuthed = (0, exports.middleware)(({ next, ctx }) => {
    var _a;
    const user = (_a = ctx.session) === null || _a === void 0 ? void 0 : _a.user;
    if (!(user === null || user === void 0 ? void 0 : user.name)) {
        throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
        ctx: {
            user: {
                ...user,
                name: user.name,
            },
        },
    });
});
/**
 * Protected base procedure
 */
exports.authedProcedure = t.procedure.use(isAuthed);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRouter = void 0;
const observable_1 = require("@trpc/server/observable");
const events_1 = require("events");
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MyEventEmitter extends events_1.EventEmitter {
}
const ee = new MyEventEmitter();
// who is currently typing, key is `name`
const currentlyTyping = Object.create(null);
// every 1s, clear old "isTyping"
const interval = setInterval(() => {
    let updated = false;
    const now = Date.now();
    for (const [key, value] of Object.entries(currentlyTyping)) {
        if (now - value.lastTyped.getTime() > 3e3) {
            delete currentlyTyping[key];
            updated = true;
        }
    }
    if (updated) {
        ee.emit("isTypingUpdate");
    }
}, 3e3);
process.on("SIGTERM", () => clearInterval(interval));
exports.postRouter = (0, trpc_1.router)({
    add: trpc_1.authedProcedure
        .input(zod_1.z.object({
        id: zod_1.z.string().uuid().optional(),
        text: zod_1.z.string().min(1),
    }))
        .mutation(async ({ input, ctx }) => {
        const { name } = ctx.user;
        const post = await prisma_1.prisma.post.create({
            data: {
                ...input,
                name,
                source: "GITHUB",
            },
        });
        ee.emit("add", post);
        delete currentlyTyping[name];
        ee.emit("isTypingUpdate");
        return post;
    }),
    isTyping: trpc_1.authedProcedure
        .input(zod_1.z.object({ typing: zod_1.z.boolean() }))
        .mutation(({ input, ctx }) => {
        const { name } = ctx.user;
        if (!input.typing) {
            delete currentlyTyping[name];
        }
        else {
            currentlyTyping[name] = {
                lastTyped: new Date(),
            };
        }
        ee.emit("isTypingUpdate");
    }),
    infinite: trpc_1.publicProcedure
        .input(zod_1.z.object({
        cursor: zod_1.z.date().nullish(),
        take: zod_1.z.number().min(1).max(50).nullish(),
    }))
        .query(async ({ input }) => {
        var _a;
        const take = (_a = input.take) !== null && _a !== void 0 ? _a : 10;
        const cursor = input.cursor;
        const page = await prisma_1.prisma.post.findMany({
            orderBy: {
                createdAt: "desc",
            },
            cursor: cursor ? { createdAt: cursor } : undefined,
            take: take + 1,
            skip: 0,
        });
        const items = page.reverse();
        let prevCursor = null;
        if (items.length > take) {
            const prev = items.shift();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            prevCursor = prev.createdAt;
        }
        return {
            items,
            prevCursor,
        };
    }),
    onAdd: trpc_1.publicProcedure.subscription(() => {
        return (0, observable_1.observable)((emit) => {
            const onAdd = (data) => emit.next(data);
            ee.on("add", onAdd);
            return () => {
                ee.off("add", onAdd);
            };
        });
    }),
    whoIsTyping: trpc_1.publicProcedure.subscription(() => {
        let prev = null;
        return (0, observable_1.observable)((emit) => {
            const onIsTypingUpdate = () => {
                const newData = Object.keys(currentlyTyping);
                if (!prev || prev.toString() !== newData.toString()) {
                    emit.next(newData);
                }
                prev = newData;
            };
            ee.on("isTypingUpdate", onIsTypingUpdate);
            return () => {
                ee.off("isTypingUpdate", onIsTypingUpdate);
            };
        });
    }),
});

/**
 * This file contains the root router of your tRPC-backend
 */
import { router, publicProcedure } from "../trpc";
import { chatRouter } from "./chatRouter";
import { roomsRouter } from "./roomRouter";
import { observable } from "@trpc/server/observable";
import { clearInterval } from "timers";
import { gameRouter } from "./gameRouter";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),

  chat: chatRouter,
  rooms: roomsRouter,
  game: gameRouter,

  randomNumber: publicProcedure.subscription(() => {
    return observable<number>((emit) => {
      const int = setInterval(() => {
        emit.next(Math.random());
      }, 500);
      return () => {
        clearInterval(int);
      };
    });
  }),
});

export type AppRouter = typeof appRouter;

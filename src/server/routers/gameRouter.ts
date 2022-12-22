import type { GameMoves } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import { prisma } from "../prisma";
import { z } from "zod";
import { authedProcedure, publicProcedure, router } from "../trpc";

interface MyEvents {
  makeMove: (data: GameMoves) => void;
  isTypingUpdate: () => void;
}
declare interface MyEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(event: TEv, ...args: Parameters<MyEvents[TEv]>): boolean;
}
class MyEventEmitter extends EventEmitter {}

const ee = new MyEventEmitter();

export const gameRouter = router({
  makeMove: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        fromId: z.string(),
        toId: z.string(),
        xCoord: z.number(),
        yCoord: z.number(),
        turn: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const room = await prisma.rooms.update({
        where: {
          id: input.roomId,
        },
        data: {
          turn: input.turn,
        },
      });
      const move = await prisma.gameMoves.create({
        data: {
          ...input,
        },
      });
      ee.emit("makeMove", move);
    }),
  getMoves: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const movesList = await prisma.gameMoves.findMany({
        where: {
          roomId: input.roomId,
        },
        select: {
          id: true,
          roomId: true,
          fromId: true,
          toId: true,
          xCoord: true,
          yCoord: true,
          turn: true,
          isHit: true,
        },
      });

      return movesList;
    }),
  hitOrMiss: publicProcedure
    .input(
      z.object({
        id: z.string(),
        isHit: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const move = await prisma.gameMoves.update({
        where: {
          id: input.id,
        },
        data: {
          isHit: input.isHit,
        },
      });
      ee.emit("makeMove", move);
    }),
  onMove: publicProcedure.subscription(() => {
    return observable<GameMoves>((emit) => {
      const onMove = (data: GameMoves) => emit.next(data);
      ee.on("makeMove", onMove);
      return () => {
        ee.off("makeMove", onMove);
      };
    });
  }),
});

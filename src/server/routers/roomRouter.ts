import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "../prisma";
import { EventEmitter } from "events";
import type { Rooms } from "@prisma/client";
import { observable } from "@trpc/server/observable";

interface MyEvents {
  roomInfoChange: (data: Rooms) => void;
}
declare interface MyEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(event: TEv, ...args: Parameters<MyEvents[TEv]>): boolean;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MyEventEmitter extends EventEmitter {}

// In a real app, you'd probably use Redis or something
const ee = new MyEventEmitter();

export const roomsRouter = router({
  createRoom: publicProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        roomname: z.string().min(1),
        roompasscode: z.string().optional(),
        createdById: z.string(),
        createdByName: z.string(),
        isPrivate: z.boolean(),
        turn: z.string(),
        createdByImage: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      //check if user already has room created
      const hasRoom = await prisma.rooms.findFirst({
        where: {
          createdById: input.createdById,
        },
      });
      const allRooms = await prisma.rooms.findMany();

      if (hasRoom) {
        throw new Error("You already created a room");
      } else if (allRooms.length > 50) {
        throw new Error("Server is full too many rooms");
      } else {
        const room = await prisma.rooms.create({
          data: {
            ...input,
          },
        });
        return room;
      }
    }),
  deleteRoom: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const room = await prisma.rooms.delete({
        where: {
          id: input.roomId,
        },
      });
      await prisma.gameMoves.deleteMany({
        where: {
          roomId: input.roomId,
        },
      });
      return room;
    }),
  joinRoom: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        opponentId: z.string(),
        opponentName: z.string(),
        isJoining: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const room = await prisma.rooms.findFirst({
        where: {
          id: input.roomId,
        },
      });

      if (input.isJoining) {
        if (room?.opponentId !== null || room.opponentName !== null) {
          throw new Error("Room is full");
        } else {
          const inARoomAlready = await prisma.rooms.findFirst({
            where: {
              opponentId: input.opponentId,
            },
          });

          if (inARoomAlready) {
            const inRoom = await prisma.rooms.update({
              where: {
                id: inARoomAlready.id,
              },
              data: {
                opponentId: null,
                opponentName: null,
              },
            });
          }

          const room = await prisma.rooms.update({
            where: {
              id: input.roomId,
            },
            data: {
              opponentId: input.opponentId,
              opponentName: input.opponentName,
            },
          });
        }
      } else {
        const room = await prisma.rooms.update({
          where: {
            id: input.roomId,
          },
          data: {
            opponentId: null,
            opponentName: null,
          },
        });
      }
    }),
  getRooms: publicProcedure
    .input(
      z.object({
        createdById: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const roomsList = await prisma.rooms.findMany({
        orderBy: {
          createdAt: "desc",
        },
        where: {
          NOT: {
            createdById: {
              equals: input.createdById,
            },
          },
        },
        select: {
          id: true,
          roomname: true,
          createdById: true,
          createdByName: true,
          isPrivate: true,
          opponentId: true,
          opponentName: true,
          opponentReady: true,
          gameStarted: true,
          turn: true,
          createdAt: true,
          createdByImage: true,
        },
      });
      return roomsList;
    }),
  getYourRoom: publicProcedure
    .input(
      z.object({
        createdById: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const yourRoom = await prisma.rooms.findFirst({
        where: {
          createdById: {
            equals: input.createdById,
          },
        },
        select: {
          id: true,
          roomname: true,
          createdById: true,
          createdByName: true,
          isPrivate: true,
          opponentId: true,
          opponentName: true,
          opponentReady: true,
          gameStarted: true,
          turn: true,
          createdAt: true,
          createdByImage: true,
        },
      });
      return yourRoom;
    }),
  getRoomInfo: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const room = await prisma.rooms.findFirst({
        where: {
          id: input.roomId,
        },
      });
      return room;
    }),
  startGame: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        gameStarted: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const room = await prisma.rooms.update({
        where: {
          id: input.roomId,
        },
        data: {
          winner: null,
          gameStarted: input.gameStarted,
        },
      });
      ee.emit("roomInfoChange", room);

      return room;
    }),
  readyUp: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        opponentReady: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const room = await prisma.rooms.update({
        where: {
          id: input.roomId,
        },
        data: {
          opponentReady: input.opponentReady,
        },
      });
      ee.emit("roomInfoChange", room);

      return room;
    }),
  winGame: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        winner: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const room = await prisma.rooms.update({
        where: {
          id: input.roomId,
        },
        data: {
          winner: input.winner,
          gameStarted: false,
        },
      });
      const moves = await prisma.gameMoves.deleteMany({
        where: {
          roomId: input.roomId,
        },
      });
      ee.emit("roomInfoChange", room);

      return room;
    }),
  changeTurn: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        turn: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      //check if user already has room created
      const room = await prisma.rooms.update({
        where: {
          id: input.roomId,
        },
        data: {
          turn: input.turn,
        },
      });
      ee.emit("roomInfoChange", room);
      return room;
    }),
  kickOpponent: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      //check if user already has room created
      const room = await prisma.rooms.update({
        where: {
          id: input.roomId,
        },
        data: {
          opponentId: null,
          opponentName: null,
          opponentReady: false,
        },
      });
      ee.emit("roomInfoChange", room);
      return room;
    }),

  onRoomInfoChange: publicProcedure.subscription(() => {
    return observable<Rooms>((emit) => {
      const onAdd = (data: Rooms) => emit.next(data);
      ee.on("roomInfoChange", onAdd);
      return () => {
        ee.off("roomInfoChange", onAdd);
      };
    });
  }),
});

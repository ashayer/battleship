import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "../prisma";

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

      console.log(allRooms.length);
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
        id: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await prisma.rooms.delete({
        where: {
          id: input.id,
        },
      });
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
  getRooms: publicProcedure.query(async ({ ctx }) => {
    const roomsList = await prisma.rooms.findMany({
      orderBy: {
        createdAt: "desc",
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
      return room;
    }),
});

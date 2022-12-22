import produce from "immer";
import { useEffect, useState } from "react";
import type { GameMoves, Rooms } from "@prisma/client";
import { useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";

type Room = Rooms;

const colors = ["", "#A5668B", "#FACFAD", "#F8BD7F", "#7DAF9C", "#95190C"];

const YourGameGrid = ({
  movesList,
  roomInfoState,
}: {
  movesList: GameMoves[] | undefined;
  roomInfoState: Room;
}) => {
  const { data: session } = useSession();
  const win = trpc.rooms.winGame.useMutation();
  const hisOrMiss = trpc.game.hitOrMiss.useMutation();
  const [grid, setGrid] = useState([
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ]);

  async function winGame() {
    await win.mutateAsync({
      roomId: roomInfoState.id,
      winner: roomInfoState?.turn as string,
    });
  }

  const checkIfWin = (gameGrid: number[][]) => {
    for (let i = 0; i < 10; i += 1) {
      for (let j = 0; j < 10; j += 1) {
        if (gameGrid[i][j] > 0) {
          return false;
        }
      }
    }
    winGame();
  };

  const checkIfHit = (gameGridValue: number, move: GameMoves) => {
    if (gameGridValue > 0) {
      hisOrMiss.mutate({ id: move.id, isHit: true });
      return -2;
    } //hit
    else if (gameGridValue === 0) {
      hisOrMiss.mutate({ id: move.id, isHit: false });
      return -1;
    } else return gameGridValue; // miss
  };

  useEffect(() => {
    async function makeMoves() {
      if (movesList) {
        const newGrid = produce(grid, (gridCopy) => {
          for (const move of movesList) {
            if (move.xCoord !== null && move.yCoord !== null && move.toId === session?.user?.id) {
              gridCopy[move.xCoord][move.yCoord] = checkIfHit(
                gridCopy[move.xCoord][move.yCoord],
                move,
              );
            }
          }
        });
        console.log(newGrid);

        checkIfWin(newGrid);
        setGrid(newGrid);
      }
    }
    makeMoves();
  }, [grid, movesList, session?.user?.id]);

  return (
    <div className="text-center mx-auto">
      <div
        className="grid text-center"
        style={{
          gridTemplateColumns: "repeat(11, minmax(10px, 50px))",
        }}
      >
        <div></div>
        {["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map((letter) => {
          return (
            <div key={letter} className="p-4">
              {letter}
            </div>
          );
        })}
        {grid.map((rows, rowIndex) =>
          rows.map((col, colIndex) => {
            return (
              <>
                {colIndex === 0 && (
                  <div className="flex items-center justify-center">{rowIndex + 1}</div>
                )}
                <div
                  role="button"
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    backgroundColor:
                      grid[rowIndex][colIndex] > 0 ? colors[grid[rowIndex][colIndex]] : "",
                    border: grid[rowIndex][colIndex] > 0 ? "none" : "1px solid white",
                    aspectRatio: 1 / 1,
                  }}
                >
                  {grid[rowIndex][colIndex]}
                </div>
              </>
            );
          }),
        )}
      </div>
    </div>
  );
};

export default YourGameGrid;

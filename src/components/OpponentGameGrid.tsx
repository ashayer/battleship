import produce from "immer";
import { useState, useEffect } from "react";
import { GameMoves } from "@prisma/client";
import { useSession } from "next-auth/react";

const getColor = (value: number) => {
  if (value === -2) {
    return "red";
  } else if (value === -1) {
    return "lightgray";
  } else {
    return "";
  }
};

const OpponentGameGrid = ({
  isYourTurn,
  movesList,
  createMove,
  changeTheTurn,
}: {
  isYourTurn: boolean;
  movesList: GameMoves[] | undefined;
  createMove: (xCoord: number, yCoord: number) => void;
  changeTheTurn: () => void;
}) => {
  const { data: session } = useSession();

  const [grid, setGrid] = useState(() => {
    const rows = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(Array.from(Array(10), () => 0));
    }
    return rows;
  });

  async function test(rowIndex: number, colIndex: number) {
    await createMove(rowIndex, colIndex);
    await changeTheTurn();
  }

  useEffect(() => {
    if (movesList) {
      const newGrid = produce(grid, (gridCopy) => {
        for (const move of movesList) {
          if (move.xCoord !== null && move.yCoord !== null && move.fromId === session?.user?.id) {
            if (move.isHit) {
              gridCopy[move.xCoord][move.yCoord] = -2;
            } else if (!move.isHit) {
              gridCopy[move.xCoord][move.yCoord] = -1;
            } else {
              gridCopy[move.xCoord][move.yCoord] = 0;
            }
          }
        }
      });
      setGrid(newGrid);
    }
  }, [grid, movesList, session?.user?.id]);

  return (
    <div className="text-center mx-auto">
      <div
        className="grid text-center "
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
                  <div
                    style={{
                      aspectRatio: 1 / 1,
                    }}
                    className="flex items-center justify-center"
                  >
                    {rowIndex + 1}
                  </div>
                )}
                <div
                  role="button"
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => {
                    if (isYourTurn && grid[rowIndex][colIndex] === 0) {
                      test(rowIndex, colIndex);
                    }
                  }}
                  style={{
                    backgroundColor: getColor(grid[rowIndex][colIndex]),
                    border: grid[rowIndex][colIndex] > 0 ? "none" : "1px solid white",
                    cursor: isYourTurn ? "pointer" : "",
                    aspectRatio: 1 / 1,
                  }}
                ></div>
              </>
            );
          }),
        )}
      </div>
    </div>
  );
};

export default OpponentGameGrid;

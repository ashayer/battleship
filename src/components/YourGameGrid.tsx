import produce from "immer";
import { Dispatch, SetStateAction, useEffect } from "react";
import type { GameMoves, Rooms } from "@prisma/client";
import { useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";

type Room = Rooms;

const colors = ["", "#A5668B", "#FACFAD", "#F8BD7F", "#7DAF9C", "#95190C"];

const YourGameGrid = ({
  movesList,
  roomInfoState,
  grid,
  setGrid,
}: {
  movesList: GameMoves[] | undefined;
  roomInfoState: Room;
  grid: number[][];
  setGrid: Dispatch<SetStateAction<number[][]>>;
}) => {
  const { data: session } = useSession();
  const win = trpc.rooms.winGame.useMutation();
  const hisOrMiss = trpc.game.hitOrMiss.useMutation();

  // const [editGrid, setEditGrid] = useState([
  //   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // ]);

  // const [currentShip, setCurrentShip] = useState(0);
  // const [isRotated, setIsRotated] = useState(false);

  function winGame() {
    win.mutate({
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
        checkIfWin(newGrid);
        setGrid(newGrid);
      }
    }
    makeMoves();
  }, [grid, movesList, session?.user?.id]);

  return (
    <div className="text-center mx-auto ">
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
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    backgroundColor: colors[grid[rowIndex][colIndex]],
                    border: grid[rowIndex][colIndex] > 0 ? "none" : "1px solid white",
                    aspectRatio: 1 / 1,
                  }}
                  id={`${rowIndex}-${colIndex}`}
                  // onMouseOver={(e) => {
                  //   const idString = e.currentTarget.id;
                  //   const row = parseInt(idString[0]);
                  //   const col = parseInt(idString[2]);

                  //   const newGrid = produce(editGrid, (gridCopy) => {
                  //     gridCopy[row][col] = currentShip;
                  //   });
                  //   setEditGrid(newGrid);
                  // }}
                  // onMouseLeave={(e) => {
                  //   const idString = e.currentTarget.id;
                  //   const row = parseInt(idString[0]);
                  //   const col = parseInt(idString[2]);
                  //   const newGrid = produce(editGrid, (gridCopy) => {
                  //     gridCopy[row][col] = 0;
                  //   });
                  //   setEditGrid(newGrid);
                  // }}
                />
              </>
            );
          }),
        )}
      </div>
      {/* <div className="flex flex-col justify-between gap-y-10 mt-10">
        <div className="flex justify-between">
          <button className="btn" onClick={() => setCurrentShip(1)}>
            1
          </button>
          <button className="btn" onClick={() => setCurrentShip(2)}>
            2
          </button>
          <button className="btn" onClick={() => setCurrentShip(3)}>
            3
          </button>
          <button className="btn" onClick={() => setCurrentShip(4)}>
            4
          </button>
          <button className="btn" onClick={() => setCurrentShip(5)}>
            5
          </button>
        </div>
        <div>
          <button className="btn" onClick={() => setIsRotated(!isRotated)}>
            Rotate
          </button>
        </div>
      </div> */}
    </div>
  );
};

export default YourGameGrid;

// const newGrid = produce(editGrid, (gridCopy) => {
//   if (isRotated) {
//     for (let i = 0; i < currentShip; i += 1) {
//       if (row + currentShip < 11) {
//         gridCopy[row + i][col] = currentShip;
//       }
//     }
//   } else {
//     for (let i = 0; i < currentShip; i += 1) {
//       if (col + currentShip < 11) {
//         gridCopy[row][col + i] = currentShip;
//       }
//     }
//   }
// });
// setEditGrid(newGrid);
// console.log(newGrid);

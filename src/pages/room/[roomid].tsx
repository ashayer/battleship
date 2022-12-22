import { NextPage } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "../../utils/trpc";
import { useSession } from "next-auth/react";
import Head from "next/head";
import type { GameMoves, Rooms } from "@prisma/client";
import YourGameGrid from "components/YourGameGrid";
import OpponentGameGrid from "components/OpponentGameGrid";
import Chat from "components/Chat";

const RoomPage: NextPage = () => {
  const router = useRouter();
  const { roomid } = router.query;
  const { data: session } = useSession();
  const [isYourRoom, setIsYourRoom] = useState(false);
  const [roomInfoState, setRoomInfoState] = useState<Rooms>();
  const utils = trpc.useContext();
  const [movesList, setMovesList] = useState<GameMoves[] | undefined>();
  const roomInfo = trpc.rooms.getRoomInfo.useQuery(
    { roomId: roomid as string },
    {
      onSuccess: () => {
        setIsYourRoom(roomInfo?.data?.createdById === session?.user?.id);
      },
    },
  );

  const getMovesQuery = trpc.game.getMoves.useQuery(
    { roomId: roomid as string },
    {
      onSuccess: () => {
        setMovesList(getMovesQuery?.data);
      },
    },
  );

  const startRoom = useCallback((incoming?: Rooms) => {
    if (incoming?.id === (roomid as string)) {
      setRoomInfoState(incoming);
    }
  }, []);

  const updateRoomInfo = useCallback((incoming?: Rooms) => {
    if (incoming?.id === (roomid as string)) {
      setRoomInfoState(incoming);
    }
  }, []);

  const startGame = trpc.rooms.startGame.useMutation();
  const changeTurn = trpc.rooms.changeTurn.useMutation();
  const readyUp = trpc.rooms.readyUp.useMutation();
  async function startTheGame(start: boolean) {
    const input = {
      roomId: roomid as string,
      gameStarted: start,
    };

    try {
      await startGame.mutateAsync(input);
    } catch (error) {}
  }

  async function readyUpPlayer() {
    const input = {
      roomId: roomid as string,
      opponentReady: true,
    };

    try {
      await readyUp.mutateAsync(input);
    } catch (error) {}
  }

  async function changeTheTurn() {
    const input = {
      roomId: roomid as string,
      turn: whichTurn(),
    };

    try {
      await changeTurn.mutateAsync(input);
    } catch (error) {}
  }

  const whichTurn = () => {
    //figure out who's turn it is
    //set to other player
    if (roomInfoState?.turn === session?.user?.id) {
      if (roomInfoState?.createdById === session?.user?.id) {
        // your room and is your turn set to opponent
        return roomInfoState?.opponentId as string;
      } else {
        // not your room and is your turn set to creator of room
        return roomInfoState?.createdById as string;
      }
    }

    return "";
  };

  const whichOpponent = () => {
    //figure out who's turn it is
    //set to other player
    if (roomInfoState?.createdById === session?.user?.id) {
      // your room and is your turn set to opponent
      return roomInfoState?.opponentName as string;
    } else {
      // not your room and is your turn set to creator of room
      return roomInfoState?.createdByName as string;
    }
  };

  const makeMoveQuery = trpc.game.makeMove.useMutation();
  async function createMove(xCoord: number, yCoord: number) {
    const input = {
      roomId: roomid as string,
      fromId: session?.user?.id as string,
      toId:
        roomInfoState?.createdById === session?.user?.id
          ? (roomInfoState?.opponentId as string)
          : (roomInfoState?.createdById as string),
      xCoord,
      yCoord,
      turn: whichTurn(),
    };

    try {
      await makeMoveQuery.mutateAsync(input);
    } catch (error) {}
  }

  const addMove = useCallback((incoming: GameMoves[] | undefined) => {
    setMovesList((current) => {
      // console.log("incoming", incoming);
      // console.log("current", current);
      const map: Record<GameMoves["id"], GameMoves> = {};
      for (const move of current ?? []) {
        map[move.id] = move;
      }
      for (const move of incoming ?? []) {
        map[move.id] = move;
      }
      return Object.values(map);
    });
  }, []);

  trpc.rooms.onRoomInfoChange.useSubscription(undefined, {
    onData(room) {
      startRoom(room);
    },
    onError(err) {
      console.error("Subscription error:", err);
    },
  });

  trpc.game.onMove.useSubscription(undefined, {
    onData(movesList) {
      addMove([movesList]);
    },
    onError(err) {
      console.error("Subscription error:", err);
    },
  });

  useEffect(() => {
    const r = roomInfo.data;
    startRoom(r as Rooms);

    const moves = getMovesQuery.data;
    addMove(moves);
  }, [addMove, getMovesQuery.data, roomInfo.data, startRoom]);

  if (roomInfo.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{roomInfoState?.createdByName}&apos;s room</title>
      </Head>
      {roomInfo.data && roomInfoState && (
        <div className="drawer drawer-end">
          <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
          <div className="drawer-content">
            <label htmlFor="my-drawer-4" className="drawer-button btn btn-primary">
              Open drawer
            </label>
            <div>
              <p>Opponent</p>
              <p>{whichOpponent()}</p>
              {roomInfoState.winner !== null && (
                <p>{roomInfoState.winner === session?.user?.id ? "You win" : "You lose"}</p>
              )}
            </div>
            {!roomInfoState.gameStarted &&
              roomInfoState.createdById === session?.user?.id &&
              roomInfoState.opponentId !== null &&
              roomInfoState.opponentReady && (
                <button onClick={() => startTheGame(true)}>Start Game</button>
              )}
            {roomInfoState.gameStarted &&
              roomInfoState.createdById === session?.user?.id &&
              roomInfoState.opponentReady && (
                <button onClick={() => startTheGame(false)}>End Game</button>
              )}
            {roomInfoState.createdById !== session?.user?.id && !roomInfoState.opponentReady && (
              <button onClick={() => readyUpPlayer()}>Ready Up</button>
            )}
            {roomInfoState.turn === session?.user?.id && roomInfoState?.gameStarted && (
              <div>It is your turn</div>
            )}
            {roomInfoState.turn !== session?.user?.id && roomInfoState?.gameStarted && (
              <>Opponent turn</>
            )}
            <div
              style={{
                display: "flex",
                border: "3px solid red",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <YourGameGrid movesList={movesList} roomInfoState={roomInfoState} />
              {roomInfoState.gameStarted && (
                <OpponentGameGrid
                  isYourTurn={roomInfoState.turn === session?.user?.id}
                  movesList={movesList}
                  createMove={createMove}
                  changeTheTurn={changeTheTurn}
                />
              )}
            </div>
          </div>
          <div className="drawer-side">
            <label htmlFor="my-drawer-4" className="drawer-overlay"></label>
            <Chat createdById={roomInfo.data.createdById || ""} />
          </div>
        </div>
      )}
    </>
  );
};

{
  /* {roomInfo.data && roomInfoState && (
        <>

        </>
      )}
    </div> */
}

export default RoomPage;

import { trpc } from "../utils/trpc";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "next-auth/core/types";
import { useRouter } from "next/router";

const CreateRoomForm = ({ createRoom, user }: { createRoom: any; user: User }) => {
  const [roomPasscode, setRoomPasscode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  async function addRoom() {
    const input = {
      roompasscode: roomPasscode,
      roomname: roomName,
      createdById: user.id,
      createdByName: user.name,
      isPrivate,
      createdByImage: user.image,
      turn: user.id,
    };

    try {
      await createRoom.mutateAsync(input);
      setRoomPasscode("");
      setRoomName("");
    } catch (err) {}
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await addRoom();
      }}
      className=""
    >
      <fieldset
        disabled={createRoom.isLoading}
        className="flex w-auto flex-col items-center text-2xl gap-y-4"
      >
        <input
          type="text"
          name="roomname"
          id="roomname"
          placeholder="Room Name"
          value={roomName}
          required
          className="input input-bordered"
          onChange={(e) => setRoomName(e.target.value)}
        />
        <input
          type="text"
          name="passcode"
          id="passcode"
          placeholder="Room Passcode"
          value={roomPasscode}
          required={isPrivate}
          className="input input-bordered"
          onChange={(e) => setRoomPasscode(e.target.value)}
        />
        <button className="btn ">Create room</button>
      </fieldset>
      {createRoom.error && <p style={{ color: "red" }}>{createRoom.error.message}</p>}
    </form>
  );
};

export default function RoomsList({ user }: { user: User }) {
  const router = useRouter();
  const listOfRooms = trpc.rooms.getRooms.useQuery({ createdById: user.id as string });
  const yourRoom = trpc.rooms.getYourRoom.useQuery({ createdById: user.id });

  const createRoom = trpc.rooms.createRoom.useMutation({
    onSuccess: () => yourRoom.refetch(),
  });

  const deleteRoom = trpc.rooms.deleteRoom.useMutation({
    onSuccess: () => yourRoom.refetch(),
  });

  const joinRoom = trpc.rooms.joinRoom.useMutation({
    onSuccess: () => listOfRooms.refetch(),
  });

  if (listOfRooms.isLoading) return <span>Loading..</span>;

  return (
    <div>
      <div className="text-center">
        <CreateRoomForm createRoom={createRoom} user={user} />
        <button
          onClick={() => listOfRooms.refetch()}
          className={`btn my-4 btn-accent ${listOfRooms.isRefetching && "loading"}`}
        >
          {!listOfRooms.isFetching && "Refresh rooms list"}
        </button>
      </div>
      <section className="m-auto sm:w-11/12 lg:w-1/2 px-4">
        {yourRoom.data && (
          <div className="flex bg-zinc-800 place-items-center justify-between p-4 rounded-2xl">
            <Link
              href={`/room/${yourRoom.data.id}`}
              className="md:text-xl w-full whitespace-nowrap overflow-hidden "
            >
              <span>
                <p>
                  <span className="font-bold">Room Name: </span>
                  <span>{yourRoom.data.roomname}</span>
                </p>
              </span>
              <p>
                <span className="font-bold">Host: </span>
                <span>{yourRoom.data.createdByName}</span>
              </p>
            </Link>
            <button
              onClick={() => deleteRoom.mutateAsync({ roomId: yourRoom.data?.id as string })}
              title="Delete your room"
            >
              Delete Your Room
            </button>
          </div>
        )}
      </section>
      <main className="m-auto mt-6 grid sm:w-11/12 2xl:grid-cols-4 px-4 gap-4">
        {listOfRooms.data?.map((room) => (
          <div
            key={room.id}
            className={`border-4 ${
              room.opponentId === user.id || room.createdById === user.id
                ? "border-green-600"
                : "border-slate-500"
            } flex-col bg-zinc-800 place-items-center overflow-hidden justify-between p-4 rounded-2xl`}
          >
            <div className="overflow-hidden whitespace-nowrap">
              <Link
                href={
                  room.opponentId === user.id || room.createdById === user.id
                    ? `/room/${room.id}`
                    : ""
                }
                className="md:text-xl w-11/12"
              >
                <span>
                  <p>
                    <span className="font-bold">Room Name: </span>
                    <span>{room.roomname}</span>
                  </p>
                  <p>
                    <span className="font-bold">Host: </span>
                    <span>{room.createdByName}</span>
                  </p>
                </span>
              </Link>
            </div>
            <div className="text-center my-2">
              {room.opponentId === user.id && (
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    joinRoom.mutate({
                      roomId: room.id,
                      isJoining: false,
                      opponentId: user.id as string,
                      opponentName: user.name as string,
                    })
                  }
                >
                  Leave
                </button>
              )}
              {room.createdById !== user.id && room.opponentId === null && (
                <button
                  className="btn btn-success"
                  onClick={async () => {
                    await joinRoom.mutate({
                      roomId: room.id,
                      isJoining: true,
                      opponentId: user.id as string,
                      opponentName: user.name as string,
                    });
                    if (joinRoom.isSuccess) {
                      router.push(`/room/${room.id}`);
                    }
                  }}
                  disabled={room.opponentId !== null}
                >
                  JOIN
                </button>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

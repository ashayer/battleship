import { trpc } from "../utils/trpc";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "next-auth/core/types";

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
      <section className="m-auto sm:w-1/2">
        {yourRoom.data && (
          <div className="flex bg-zinc-800 place-items-center justify-between p-4 rounded-2xl">
            <section className="md:text-2xl">
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
            </section>
            {yourRoom.data.opponentId === user.id ||
              (yourRoom.data.createdById === user.id && (
                <Link href={`/room/${yourRoom.data.id}`} title="View room">
                  View Room
                </Link>
              ))}
            <section>
              <button
                onClick={() => deleteRoom.mutateAsync({ id: yourRoom.data?.id as string })}
                title="Delete your room"
              >
                Delete Room
              </button>
            </section>

            <div>
              <Image
                src={yourRoom.data.createdByImage as string}
                alt="Profile image"
                width={50}
                height={50}
                className="rounded-full"
              />
            </div>
          </div>
        )}
      </section>
      <main className="m-auto mt-6 grid sm:w-8/12 2xl:grid-cols-2">
        {listOfRooms.data?.map((room) => (
          <div
            key={room.id}
            className="border border-slate-500 flex bg-zinc-800 place-items-center justify-between p-4 rounded-2xl"
          >
            <section className="md:text-xl overflow-x-hidden">
              <span>
                <p>
                  <span className="font-bold">Room Name: </span>
                  <span>{room.roomname}</span>
                </p>
              </span>
              <p>
                <span className="font-bold">Host: </span>
                <span>{room.createdByName}</span>
              </p>
            </section>
            {room.opponentId === user.id && (
              <Link href={`/room/${room.id}`} title="View room">
                View Room
              </Link>
            )}
            {room.createdById === user.id && (
              <Link href={`/room/${room.id}`} title="View room">
                View Room
              </Link>
            )}
            {room.opponentId === user.id && (
              <button
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
            {room.createdById === user.id && (
              <section>
                <button
                  onClick={() => deleteRoom.mutateAsync({ id: room.id as string })}
                  title="Delete your room"
                >
                  Delete Room
                </button>
              </section>
            )}
            {room.createdById !== user.id && room.opponentId === null && (
              <button
                onClick={() =>
                  joinRoom.mutate({
                    roomId: room.id,
                    isJoining: true,
                    opponentId: user.id as string,
                    opponentName: user.name as string,
                  })
                }
                disabled={room.opponentId !== null}
              >
                JOIN
              </button>
            )}
            <div>
              <Image
                src={room.createdByImage as string}
                alt="Profile image"
                width={50}
                height={50}
                className="rounded-full"
              />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

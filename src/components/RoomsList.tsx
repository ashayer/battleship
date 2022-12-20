import { trpc } from "../utils/trpc";
import { useCallback, useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

const CreateRoomForm = ({ createRoom }: { createRoom: any }) => {
  const { data: session } = useSession();

  const [roomPasscode, setRoomPasscode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  async function addRoom() {
    const input = {
      roompasscode: roomPasscode,
      roomname: roomName,
      createdById: session?.user?.id as string,
      createdByName: session?.user?.name as string,
      isPrivate,
      createdByImage: session?.user?.image as string,
      turn: session?.user?.id as string,
    };

    try {
      await createRoom.mutateAsync(input);
      setRoomPasscode("");
      setRoomName("");
    } catch (err) {}
  }
  const userName = session?.user?.name;

  if (!userName) {
    return (
      <div>
        <p>You have to sign in to create a game.</p>
        <button onClick={() => signIn("", { callbackUrl: "/" })}>Sign In</button>
      </div>
    );
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

export default function RoomsList() {
  const { data: session, status } = useSession();
  const listOfRooms = trpc.rooms.getRooms.useQuery();

  const createRoom = trpc.rooms.createRoom.useMutation({
    onSuccess: () => listOfRooms.refetch(),
  });

  const deleteRoom = trpc.rooms.deleteRoom.useMutation({
    onSuccess: () => listOfRooms.refetch(),
  });

  const joinRoom = trpc.rooms.joinRoom.useMutation({
    onSuccess: () => listOfRooms.refetch(),
  });

  if (status === "loading") return <span>Loading...</span>;

  if (status === "unauthenticated")
    return (
      <div>
        <p>You have to sign in to use.</p>
        <button onClick={() => signIn("", { callbackUrl: "/" })}>Sign In</button>
      </div>
    );

  if (listOfRooms.isLoading) return <span>Loading..</span>;

  return (
    <div>
      <div className="text-center">
        <CreateRoomForm createRoom={createRoom} />
        <button
          onClick={() => listOfRooms.refetch()}
          className={`btn my-4 btn-accent ${listOfRooms.isRefetching && "loading"}`}
        >
          {!listOfRooms.isFetching && "Refresh rooms list"}
        </button>
      </div>
      <main className="m-auto mt-6 grid sm:w-8/12 2xl:grid-cols-2">
        {listOfRooms.data?.map((room) => (
          <div key={room.id} className="border">
            <section>
              <span>
                <p>
                  <span>Room Name: </span>
                  <span>{room.roomname}</span>
                </p>
              </span>
              <p>
                <span>Host: </span>
                <span>{room.createdByName}</span>
              </p>
            </section>
            {room.opponentId === session?.user?.id && (
              <Link href={`/room/${room.id}`} title="View room">
                View Room
              </Link>
            )}
            {room.createdById === session?.user?.id && (
              <Link href={`/room/${room.id}`} title="View room">
                View Room
              </Link>
            )}

            {room.opponentId === session?.user?.id && (
              <button
                onClick={() =>
                  joinRoom.mutate({
                    roomId: room.id,
                    isJoining: false,
                    opponentId: session?.user?.id as string,
                    opponentName: session?.user?.name as string,
                  })
                }
              >
                Leave
              </button>
            )}
            {room.createdById === session?.user?.id && (
              <section>
                <button
                  onClick={() => deleteRoom.mutateAsync({ id: room.id as string })}
                  title="Delete your room"
                >
                  Delete Room
                </button>
              </section>
            )}
            {room.createdById !== session?.user?.id && room.opponentId === null && (
              <button
                onClick={() =>
                  joinRoom.mutate({
                    roomId: room.id,
                    isJoining: true,
                    opponentId: session?.user?.id as string,
                    opponentName: session?.user?.name as string,
                  })
                }
                disabled={room.opponentId !== null}
              >
                JOIN
              </button>
            )}
            <Image
              src={room.createdByImage as string}
              alt="Profile image"
              width={50}
              height={50}
              className="rounded-full"
            />
          </div>
        ))}
      </main>
    </div>
  );
}

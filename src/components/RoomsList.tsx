import { trpc } from "../utils/trpc";
import { useCallback, useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
// import Chat from "./Chat";

//! fix type here
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
        <button onClick={() => signIn("google", { callbackUrl: "/" })} data-testid="signin">
          Sign In
        </button>
      </div>
    );
  }
  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await addRoom();
        }}
        className="text-center"
      >
        <fieldset
          disabled={createRoom.isLoading}
          style={{ border: "none" }}
          className="flex w-auto flex-col items-center text-2xl"
        >
          <input
            type="text"
            name="roomname"
            id="roomname"
            placeholder="Room Name"
            value={roomName}
            required
            className="m-3 rounded"
            onChange={(e) => setRoomName(e.target.value)}
          />
          <input
            type="text"
            name="passcode"
            id="passcode"
            placeholder="Room Passcode"
            value={roomPasscode}
            required={isPrivate}
            className="m-3 rounded"
            onChange={(e) => setRoomPasscode(e.target.value)}
          />
          <button className="transition-ease transform rounded bg-black py-2 px-4 text-2xl font-bold text-white duration-75 hover:scale-110">
            Create room
          </button>
        </fieldset>
        {createRoom.error && <p style={{ color: "red" }}>{createRoom.error.message}</p>}
      </form>
    </div>
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

  if (listOfRooms.isLoading) return <span>Loading..</span>;

  return (
    <div>
      <section className="mt-6 text-center">
        <CreateRoomForm createRoom={createRoom} />
        <button
          className="mt-4 transform rounded bg-white py-2 px-4 text-2xl font-bold transition-all duration-75  hover:scale-110 "
          onClick={() => listOfRooms.refetch()}
        >
          Refresh rooms list
        </button>
      </section>
      <main className="m-auto mt-6 grid sm:w-8/12 2xl:grid-cols-2">
        {listOfRooms.data?.map((room) => (
          <div
            className="w-12/12 m-1  flex transform items-center rounded-lg bg-white transition-all 2xl:w-11/12"
            key={room.id}
          >
            <section className="ml-2 flex-1 flex-col p-1 text-2xl">
              <span>
                <p>
                  <span className="font-bold">Room Name: </span>
                  <span>{room.roomname}</span>
                </p>
              </span>
              <p>
                <span className=" font-bold">Host: </span>
                <span>{room.createdByName}</span>
              </p>
            </section>
            {room.opponentId === session?.user?.id && (
              <Link href={`/room/${room.id}`}>
                <a title="View room">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </a>
              </Link>
            )}
            {room.createdById === session?.user?.id && (
              <Link href={`/room/${room.id}`}>
                <a title="View room">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </a>
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
                className="mx-2 transform rounded bg-red-700 py-2 px-4 text-2xl font-bold text-white transition-all duration-75  hover:scale-110 "
              >
                Leave
              </button>
            )}
            {room.createdById === session?.user?.id && (
              <section className="flex flex-1 justify-end ">
                <button
                  onClick={() => deleteRoom.mutateAsync({ id: room.id as string })}
                  title="Delete your room"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
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
                className="mr-4 transform rounded bg-black py-2 px-4 text-2xl font-bold text-white transition-all duration-75  hover:scale-110 "
                disabled={room.opponentId !== null}
              >
                JOIN
              </button>
            )}
            <div className="mr-2">
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

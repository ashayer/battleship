import { trpc } from "../utils/trpc";
import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

function AddMessageForm({ createdById, roomid }: { createdById: string; roomid: string }) {
  const addPost = trpc.chat.add.useMutation();
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [enterToPostMessage, setEnterToPostMessage] = useState(true);
  async function postMessage() {
    const input = {
      text: message,
      fromId: session?.user?.id as string,
      toId: createdById,
      roomID: roomid as string,
    };
    try {
      await addPost.mutateAsync(input);
      setMessage("");
    } catch {}
  }

  const userName = session?.user?.name;
  if (!userName) {
    return (
      <div>
        <p>You have to sign in to write.</p>
        <button onClick={() => signIn("google")} data-testid="signin">
          Sign In
        </button>
      </div>
    );
  }
  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await postMessage();
        }}
      >
        <fieldset disabled={addPost.isLoading}>
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={message.split(/\r|\n/).length}
              id="text"
              name="text"
              onKeyDown={async (e) => {
                if (e.key === "Shift") {
                  setEnterToPostMessage(false);
                }
                if (e.key === "Enter" && enterToPostMessage) {
                  postMessage();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === "Shift") {
                  setEnterToPostMessage(true);
                }
              }}
              onBlur={() => {
                setEnterToPostMessage(true);
              }}
            />
            <div>
              <button type="submit">Submit</button>
            </div>
          </div>
        </fieldset>
        {addPost.error && <p style={{ color: "red" }}>{addPost.error.message}</p>}
      </form>
    </>
  );
}

export default function Chat({ createdById }: { createdById: string }) {
  const router = useRouter();
  const { roomid } = router.query;
  const postsQuery = trpc.chat.infinite.useInfiniteQuery(
    { roomId: roomid as string },
    {
      getPreviousPageParam: (d) => d.prevCursor,
    },
  );

  const utils = trpc.useContext();
  const { hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage } = postsQuery;

  // list of messages that are rendered
  const [messages, setMessages] = useState(() => {
    const msgs = postsQuery.data?.pages.map((page) => page.items).flat();
    return msgs;
  });
  type Message = NonNullable<typeof messages>[number];
  const { data: session } = useSession();
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  // fn to add and dedupe new messages onto state
  const addMessages = useCallback((incoming?: Message[]) => {
    setMessages((current) => {
      const map: Record<Message["id"], Message> = {};
      for (const msg of current ?? []) {
        if (msg.roomID === roomid) {
          map[msg.id] = msg;
        }
      }
      for (const msg of incoming ?? []) {
        if (msg.roomID === roomid) {
          map[msg.id] = msg;
        }
      }
      return Object.values(map).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    });
  }, []);

  // when new data from `useInfiniteQuery`, merge with current state
  useEffect(() => {
    const msgs = postsQuery.data?.pages.map((page) => page.items).flat();
    addMessages(msgs);
  }, [postsQuery.data?.pages, addMessages]);

  const scrollToBottomOfList = useCallback(() => {
    if (scrollTargetRef.current == null) {
      return;
    }

    scrollTargetRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [scrollTargetRef]);
  useEffect(() => {
    scrollToBottomOfList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // subscribe to new posts and add
  trpc.chat.onAdd.useSubscription(undefined, {
    onData(chatMessage) {
      addMessages([chatMessage]);
    },
    onError(err) {
      console.error("Subscription error:", err);
      // we might have missed a message - invalidate cache
      utils.chat.infinite.invalidate();
    },
  });

  return (
    <>
      <div>
        <div>
          <div>
            <div>
              <div>
                {messages?.map((item) => {
                  return (
                    <div key={item.id}>
                      <p>{item.name}</p>
                      <p
                        style={{
                          backgroundColor: item.fromId === session?.user?.id ? "gray" : "#FF3A20",
                          overflowWrap: "break-word",
                          alignSelf: item.fromId === session?.user?.id ? "end" : "start",
                          borderRadius: "10px",
                          padding: 1,
                        }}
                      >
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 5 }}>
                <AddMessageForm createdById={createdById} roomid={roomid as string} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

{
  /* <div>
          <section>
            <div>
              <button
                data-testid="loadMore"
                onClick={() => fetchPreviousPage()}
                disabled={!hasPreviousPage || isFetchingPreviousPage}
              >
                {isFetchingPreviousPage
                  ? "Loading more..."
                  : hasPreviousPage
                  ? "Load More"
                  : "Nothing more to load"}
              </button>
              <div>
                {messages?.map((item) => (
                  <article key={item.id}>
                    <header>
                      <h3>{item.name}</h3>
                      <span>
                        {new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(item.createdAt)}
                      </span>
                    </header>
                    <p>{item.text}</p>
                  </article>
                ))}
                <div ref={scrollTargetRef}></div>
              </div>
            </div>

          </section>
        </div> */
}

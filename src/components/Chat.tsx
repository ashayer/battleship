import { trpc } from "../utils/trpc";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { RiSendPlane2Fill, RiCloseFill } from "react-icons/ri";
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

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await postMessage();
      }}
      className="p-4"
    >
      <fieldset disabled={addPost.isLoading}>
        <div className="flex justify-between gap-x-4">
          <textarea
            className="textarea w-full"
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
            <button type="submit" className="btn">
              <RiSendPlane2Fill className="w-8 h-8" />
            </button>
          </div>
        </div>
      </fieldset>
      {addPost.error && <p style={{ color: "red" }}>{addPost.error.message}</p>}
    </form>
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
    <div className="bg-slate-900 w-auto flex flex-col">
      <label
        htmlFor="my-drawer-4"
        className="drawer-button btn m-4 top-0 z-30 bg-rose-600 w-16 left-0"
      >
        <RiCloseFill className="w-8 h-8 " />
      </label>
      <div className="flex-1">
        {messages?.map((message) => {
          return (
            <div key={message.id}>
              {session?.user?.id !== message.fromId && (
                <div className="chat chat-start">
                  <div className="chat-header">
                    {message.name}
                    <time className="text-xs opacity-50">
                      {message.createdAt.toLocaleDateString(navigator.language, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <div className="chat-bubble">{message.text}</div>
                </div>
              )}
              {session?.user?.id === message.fromId && (
                <div className="chat chat-end">
                  <div className="chat-header">
                    {message.name}
                    <time className="text-xs opacity-50">
                      {message.createdAt.toLocaleDateString(navigator.language, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <div className="chat-bubble bg-purple-400 text-black">{message.text}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div>
        <AddMessageForm createdById={createdById} roomid={roomid as string} />
      </div>
    </div>
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

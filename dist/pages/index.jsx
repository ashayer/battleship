"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const trpc_1 = require("../utils/trpc");
const react_query_devtools_1 = require("@tanstack/react-query-devtools");
const react_1 = require("next-auth/react");
const head_1 = __importDefault(require("next/head"));
const react_2 = require("react");
function AddMessageForm({ onMessagePost }) {
    var _a;
    const addPost = trpc_1.trpc.post.add.useMutation();
    const { data: session } = (0, react_1.useSession)();
    const [message, setMessage] = (0, react_2.useState)("");
    const [enterToPostMessage, setEnterToPostMessage] = (0, react_2.useState)(true);
    async function postMessage() {
        const input = {
            text: message,
        };
        try {
            await addPost.mutateAsync(input);
            setMessage("");
            onMessagePost();
        }
        catch { }
    }
    const isTyping = trpc_1.trpc.post.isTyping.useMutation();
    const userName = (_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.name;
    if (!userName) {
        return (<div className="flex justify-between w-full px-3 py-2 text-lg text-gray-200 bg-gray-800 rounded">
        <p className="font-bold">
          You have to{" "}
          <button className="inline font-bold underline" onClick={() => (0, react_1.signIn)("google")}>
            sign in
          </button>{" "}
          to write.
        </p>
        <button onClick={() => (0, react_1.signIn)("google")} data-testid="signin" className="h-full px-4 bg-indigo-500 rounded">
          Sign In
        </button>
      </div>);
    }
    return (<>
      <form onSubmit={async (e) => {
            e.preventDefault();
            /**
             * In a real app you probably don't want to use this manually
             * Checkout React Hook Form - it works great with tRPC
             * @link https://react-hook-form.com/
             */
            await postMessage();
        }}>
        <fieldset disabled={addPost.isLoading} className="min-w-0">
          <div className="flex items-end w-full px-3 py-2 text-lg text-gray-200 bg-gray-500 rounded">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="flex-1 bg-transparent outline-0" rows={message.split(/\r|\n/).length} id="text" name="text" autoFocus onKeyDown={async (e) => {
            if (e.key === "Shift") {
                setEnterToPostMessage(false);
            }
            if (e.key === "Enter" && enterToPostMessage) {
                postMessage();
            }
            isTyping.mutate({ typing: true });
        }} onKeyUp={(e) => {
            if (e.key === "Shift") {
                setEnterToPostMessage(true);
            }
        }} onBlur={() => {
            setEnterToPostMessage(true);
            isTyping.mutate({ typing: false });
        }}/>
            <div>
              <button type="submit" className="px-4 py-1 bg-indigo-500 rounded">
                Submit
              </button>
            </div>
          </div>
        </fieldset>
        {addPost.error && (<p style={{ color: "red" }}>{addPost.error.message}</p>)}
      </form>
    </>);
}
function IndexPage() {
    var _a, _b;
    const postsQuery = trpc_1.trpc.post.infinite.useInfiniteQuery({}, {
        getPreviousPageParam: (d) => d.prevCursor,
    });
    const utils = trpc_1.trpc.useContext();
    const { hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage } = postsQuery;
    // list of messages that are rendered
    const [messages, setMessages] = (0, react_2.useState)(() => {
        var _a;
        const msgs = (_a = postsQuery.data) === null || _a === void 0 ? void 0 : _a.pages.map((page) => page.items).flat();
        return msgs;
    });
    const { data: session } = (0, react_1.useSession)();
    const userName = (_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.name;
    const scrollTargetRef = (0, react_2.useRef)(null);
    // fn to add and dedupe new messages onto state
    const addMessages = (0, react_2.useCallback)((incoming) => {
        setMessages((current) => {
            const map = {};
            for (const msg of current !== null && current !== void 0 ? current : []) {
                map[msg.id] = msg;
            }
            for (const msg of incoming !== null && incoming !== void 0 ? incoming : []) {
                map[msg.id] = msg;
            }
            return Object.values(map).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        });
    }, []);
    // when new data from `useInfiniteQuery`, merge with current state
    (0, react_2.useEffect)(() => {
        var _a;
        const msgs = (_a = postsQuery.data) === null || _a === void 0 ? void 0 : _a.pages.map((page) => page.items).flat();
        addMessages(msgs);
    }, [(_b = postsQuery.data) === null || _b === void 0 ? void 0 : _b.pages, addMessages]);
    const scrollToBottomOfList = (0, react_2.useCallback)(() => {
        if (scrollTargetRef.current == null) {
            return;
        }
        scrollTargetRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [scrollTargetRef]);
    (0, react_2.useEffect)(() => {
        scrollToBottomOfList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // subscribe to new posts and add
    trpc_1.trpc.post.onAdd.useSubscription(undefined, {
        onData(post) {
            addMessages([post]);
        },
        onError(err) {
            console.error("Subscription error:", err);
            // we might have missed a message - invalidate cache
            utils.post.infinite.invalidate();
        },
    });
    const [currentlyTyping, setCurrentlyTyping] = (0, react_2.useState)([]);
    trpc_1.trpc.post.whoIsTyping.useSubscription(undefined, {
        onData(data) {
            setCurrentlyTyping(data);
        },
    });
    return (<>
      <head_1.default>
        <title>Prisma Starter</title>
        <link rel="icon" href="/favicon.ico"/>
      </head_1.default>
      <div className="flex flex-col h-screen md:flex-row">
        <section className="flex flex-col w-full bg-gray-800 md:w-72">
          <div className="flex-1 overflow-y-hidden">
            <div className="flex flex-col h-full divide-y divide-gray-700">
              <header className="p-4">
                <h1 className="text-3xl font-bold text-gray-50">
                  tRPC WebSocket starter
                </h1>
                <p className="text-sm text-gray-400">
                  Showcases WebSocket + subscription support
                  <br />
                  <a className="text-gray-100 underline" href="https://github.com/trpc/examples-next-prisma-starter-websockets" target="_blank" rel="noreferrer">
                    View Source on GitHub
                  </a>
                </p>
              </header>
              <div className="flex-1 hidden p-4 space-y-6 overflow-y-auto text-gray-400 md:block">
                <article className="space-y-2">
                  <h2 className="text-lg text-gray-200">Introduction</h2>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Open inspector and head to Network tab</li>
                    <li>All client requests are handled through WebSockets</li>
                    <li>
                      We have a simple backend subscription on new messages that
                      adds the newly added message to the current state
                    </li>
                  </ul>
                </article>
                {userName && (<article>
                    <h2 className="text-lg text-gray-200">User information</h2>
                    <ul className="space-y-2">
                      <li className="text-lg">
                        You&apos;re{" "}
                        <input id="name" name="name" type="text" disabled className="bg-transparent" value={userName}/>
                      </li>
                      <li>
                        <button onClick={() => (0, react_1.signOut)()}>Sign Out</button>
                      </li>
                    </ul>
                  </article>)}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 hidden h-16 md:block"></div>
        </section>
        <div className="flex-1 overflow-y-hidden md:h-screen">
          <section className="flex flex-col justify-end h-full p-4 space-y-4 bg-gray-700">
            <div className="space-y-4 overflow-y-auto">
              <button data-testid="loadMore" onClick={() => fetchPreviousPage()} disabled={!hasPreviousPage || isFetchingPreviousPage} className="px-4 py-2 text-white bg-indigo-500 rounded disabled:opacity-40">
                {isFetchingPreviousPage
            ? "Loading more..."
            : hasPreviousPage
                ? "Load More"
                : "Nothing more to load"}
              </button>
              <div className="space-y-4">
                {messages === null || messages === void 0 ? void 0 : messages.map((item) => (<article key={item.id} className=" text-gray-50">
                    <header className="flex space-x-2 text-sm">
                      <h3 className="text-md">
                        {item.source === "RAW" ? (item.name) : (<a href={`https://github.com/${item.name}`} target="_blank" rel="noreferrer">
                            {item.name}
                          </a>)}
                      </h3>
                      <span className="text-gray-500">
                        {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "short",
                timeStyle: "short",
            }).format(item.createdAt)}
                      </span>
                    </header>
                    <p className="text-xl leading-tight whitespace-pre-line">
                      {item.text}
                    </p>
                  </article>))}
                <div ref={scrollTargetRef}></div>
              </div>
            </div>
            <div className="w-full">
              <AddMessageForm onMessagePost={() => scrollToBottomOfList()}/>
              <p className="h-2 italic text-gray-400">
                {currentlyTyping.length
            ? `${currentlyTyping.join(", ")} typing...`
            : ""}
              </p>
            </div>

            {process.env.NODE_ENV !== "production" && (<div className="hidden md:block">
                <react_query_devtools_1.ReactQueryDevtools initialIsOpen={false}/>
              </div>)}
          </section>
        </div>
      </div>
    </>);
}
exports.default = IndexPage;
/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @link https://trpc.io/docs/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createSSGHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });
//
//   await ssg.fetchQuery('post.all');
//
//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };

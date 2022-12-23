import {  useSession } from "next-auth/react";
import Head from "next/head";
import RoomsList from "components/RoomsList";
import Unauthenticated from "components/Unauthenticated";
import Navbar from "components/Navbar";
import type { User } from "next-auth/core/types";

export default function IndexPage() {
  const { data: session, status } = useSession();
  if (status === "loading") return <>Loading...</>;

  if (status === "unauthenticated" || session === null || session.user === null)
    return <Unauthenticated />;

  return (
    <>
      <Head>
        <title>Battleship</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {session.user && <Navbar session={session} />}
      <main>
        <RoomsList user={session.user as User} />
      </main>
    </>
  );
}

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

{
  /* <h1 className="text-center my-6 text-5xl font-bold border">Rooms list</h1>
        <div className="">
          <Image
            src={session?.user?.image as string}
            alt="Profile image"
            width={50}
            height={50}
            className="rounded-full"
          />
        </div> */
}

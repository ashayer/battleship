import { trpc } from "../utils/trpc";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import RoomsList from "components/RoomsList";
import Image from "next/image";
import Link from "next/link";

export default function IndexPage() {
  const { data: session } = useSession();

  console.log();

  return (
    <>
      <Head>
        <title>Battleship</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <nav>
        <div className="navbar bg-base-100">
          <div className="navbar-start"></div>
          <div className="navbar-center">
            <Link href={"/"} className="btn btn-ghost normal-case font-bold text-5xl">
              Room List
            </Link>
          </div>
          <div className="navbar-end">
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="rounded-full">
                  <Image
                    src={session?.user?.image as string}
                    alt="Profile image"
                    width={50}
                    height={50}
                  />
                </div>
              </label>
              <ul
                tabIndex={0}
                className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <a onClick={() => signOut()}>Logout</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <RoomsList />
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

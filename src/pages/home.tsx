import { signOut, useSession } from "next-auth/react";
import { NextPage } from "next";

const Home: NextPage = () => {
  const { data: session } = useSession();

  return <div></div>;
};

export default Home;

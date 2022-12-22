import { useSession, signIn } from "next-auth/react";

const Unauthenticated = () => {
  return (
    <div className="h-screen flex flex-col gap-y-4 justify-center items-center">
      <button className="btn btn-primary" onClick={() => signIn()}>
        Sign In To Use
      </button>
    </div>
  );
};

export default Unauthenticated;

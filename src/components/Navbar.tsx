import Image from "next/image";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth/core/types";
import Link from "next/link";

const Navbar = ({ session }: { session: Session }) => {
  return (
    <nav className="navbar w-screen">
      <div className="navbar-start"></div>
      <div className="navbar-center">
        <p className="font-bold text-4xl">
          <Link href={"/"}>Battleship</Link>
        </p>
      </div>
      <div className="navbar-end">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar m-4">
            <div className="rounded-full">
              <Image src={session.user?.image || ""} alt="Profile image" width={50} height={50} />
            </div>
          </label>
          <ul className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <a onClick={() => signOut()}>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

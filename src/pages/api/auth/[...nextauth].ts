import NextAuth from "next-auth";
import { AppProviders } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../utils/client";

let useMockProvider = process.env.NODE_ENV === "test";
const { GITHUB_CLIENT_ID, GITHUB_SECRET, NODE_ENV, APP_ENV } = process.env;
if ((NODE_ENV !== "production" || APP_ENV === "test") && (!GITHUB_CLIENT_ID || !GITHUB_SECRET)) {
  console.log("⚠️ Using mocked GitHub auth correct credentials were not added");
  useMockProvider = true;
}
const providers: AppProviders = [];
if (useMockProvider) {
  providers.push(
    CredentialsProvider({
      id: "github",
      name: "Mocked GitHub",
      async authorize(credentials) {
        if (credentials) {
          const user = {
            id: credentials.name,
            name: credentials.name,
            email: credentials.name,
          };
          return user;
        }
        return null;
      },
      credentials: {
        name: { type: "test" },
      },
    }),
  );
} else {
  providers.push(
    GithubProvider({
      clientId: GITHUB_CLIENT_ID as string,
      clientSecret: GITHUB_SECRET as string,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.login,
          email: profile.email,
          image: profile.avatar_url,
        } as any;
      },
    }),
  );
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
  );
}
export default NextAuth({
  // Configure one or more authentication providers
  providers,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

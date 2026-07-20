import { cookies } from "next/headers";
import { getIronSession, IronSessionData } from "iron-session";
import type { Role } from "./types";

export interface SessionData {
  userId: string;
  adegaId: string;
  adegaName: string;
  name: string;
  email: string;
  role: Role;
}

declare module "iron-session" {
  interface IronSessionData {
    user?: SessionData;
  }
}

const sessionPassword =
  process.env.SESSION_SECRET ??
  "chave_de_desenvolvimento_local_apenas_para_prototipo_32chars";

export const sessionOptions = {
  password: sessionPassword,
  cookieName: "adegas_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession() {
  const cookieStore = cookies();
  return getIronSession<IronSessionData>(cookieStore, sessionOptions);
}

export async function getCurrentUser(): Promise<SessionData | null> {
  const session = await getSession();
  return session.user ?? null;
}

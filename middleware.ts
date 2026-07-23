import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, IDLE_TIMEOUT_MS, type SessionData } from "@/lib/session";

/** Só cuida do cookie de sessão (renovar a atividade a cada requisição, ou limpar se
 * ficou ocioso demais) — nenhuma relação com CSP/headers de segurança, que continuam
 * definidos estaticamente em next.config.js. */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<{ user?: SessionData }>(req, res, sessionOptions);

  if (session.user) {
    if (Date.now() - session.user.lastActivityAt > IDLE_TIMEOUT_MS) {
      session.destroy();
    } else {
      session.user.lastActivityAt = Date.now();
      await session.save();
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};

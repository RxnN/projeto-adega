import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, getAdegaById } from "@/lib/repo";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const password = (body?.password ?? "").toString();

  if (!email || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const adega = getAdegaById(user.adegaId);

  const session = await getSession();
  session.user = {
    userId: user.id,
    adegaId: user.adegaId,
    adegaName: adega?.name ?? "Adega",
    name: user.name,
    email: user.email,
    role: user.role,
  };
  await session.save();

  return NextResponse.json({ ok: true, role: user.role });
}

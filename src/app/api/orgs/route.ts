import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, anthropicKey } = await req.json();

  if (!name || !anthropicKey) {
    return NextResponse.json(
      { error: "Name and API key are required" },
      { status: 400 }
    );
  }

  const org = await db.organization.create({
    data: {
      name,
      anthropicKeyEnc: encrypt(anthropicKey),
      members: {
        create: {
          userId: session.user.id,
          role: "ADMIN",
        },
      },
    },
  });

  return NextResponse.json({ id: org.id });
}

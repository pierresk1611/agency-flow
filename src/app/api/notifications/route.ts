import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Uprav cestu podľa tvojej auth konfigurácie

// GET: Načítanie notifikácií pre prihláseného usera
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20, // Načítame posledných 20
  });

  return NextResponse.json(notifications);
}

// PATCH: Označenie notifikácie ako prečítanej
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { id } = body;

  await prisma.notification.update({
    where: {
      id: id,
      userId: session.user.id, // Bezpečnostná kontrola: user môže updatnuť len svoje
    },
    data: {
      isRead: true,
    },
  });

  return NextResponse.json({ success: true });
}
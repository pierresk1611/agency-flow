import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Chyba pri vytváraní notifikácie:", error);
  }
}
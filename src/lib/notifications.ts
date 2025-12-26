import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        isRead: false,
      },
    });
    return notification;
  } catch (error) {
    console.error("Chyba pri vytváraní notifikácie:", error);
  }
}
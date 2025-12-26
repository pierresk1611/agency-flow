"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react"; // Predpokladám, že máš lucide-react ikony

type Notification = {
  id: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // 1. Načítanie notifikácií
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Tip: Tu by sa dal nastaviť interval (polling) každých 30 sekúnd na refresh
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 2. Kliknutie na notifikáciu
  const handleNotificationClick = async (notification: Notification) => {
    // Označiť ako prečítané na backend
    if (!notification.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ id: notification.id }),
      });
      
      // Lokálny update stavu
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }

    // Presmerovanie
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Tlačidlo Zvonček */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Rozbaľovacie okno (Popover) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b bg-gray-50 font-semibold text-sm">
            Notifikácie
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Žiadne nové notifikácie
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition ${
                    !n.isRead ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="font-semibold text-sm text-gray-800">
                    {n.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{n.message}</div>
                  <div className="text-[10px] text-gray-400 mt-2 text-right">
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Overlay na zatvorenie pri kliknutí mimo */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}
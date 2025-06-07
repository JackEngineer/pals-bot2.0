"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  emoji: string;
}

const navItems: NavItem[] = [
  {
    id: "home",
    label: "海边",
    icon: "🌊",
    path: "/",
    emoji: "🏖️",
  },
  {
    id: "chat",
    label: "聊天",
    icon: "💬",
    path: "/chat",
    emoji: "💭",
  },
  {
    id: "voices",
    label: "心声",
    icon: "💗",
    path: "/voices",
    emoji: "🎭",
  },
  {
    id: "profile",
    label: "我的",
    icon: "👤",
    path: "/profile",
    emoji: "🏠",
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavClick = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-ocean-200 px-4 py-2">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                active
                  ? "bg-ocean-500 text-white shadow-lg shadow-ocean-500/25"
                  : "text-ocean-600 hover:bg-ocean-50 active:scale-95"
              }`}
            >
              <div
                className={`text-lg mb-1 transition-transform duration-200 ${
                  active ? "animate-bounce" : ""
                }`}
              >
                {active ? item.emoji : item.icon}
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? "text-white" : "text-ocean-700"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="rounded-full border border-[#344d6d] bg-[#0d1a2a] px-3 py-2 text-xs font-bold text-[#9fb0c9] transition hover:border-[#506f98] hover:bg-[#142842] hover:text-[#eef4ff]"
    >
      {isLoggingOut ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}

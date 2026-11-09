"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch {
      router.push("/login");
    }
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h1>ชื่อ: {user.name}</h1>
      <h2>ตำแหน่ง: {user.role}</h2>
      <button onClick={() => { localStorage.clear(); router.push("/login"); }}>
        ออกจากระบบ
      </button>
    </div>
  );
}

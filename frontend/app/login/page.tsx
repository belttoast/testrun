"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoints = [
      "http://localhost:5000/api/login",
      "http://127.0.0.1:5000/api/login",
      "/api/login",
    ];

    let lastError = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้";

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const result = await res.json().catch(() => null);

        if (!result) {
          continue;
        }

        if (res.ok && result.data?.token) {
          localStorage.setItem("token", result.data.token);
          localStorage.setItem("user", JSON.stringify(result.data.user));
          router.push("/dashboard");
          return;
        } else {
          setMessage({
            text: result.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
            isError: true,
          });
          setLoading(false);
          return;
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          lastError = err.message;
        }
      }
    }

    setMessage({
      text: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend (port 5000) ได้: ${lastError}`,
      isError: true,
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 dark:bg-neutral-900">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">เข้าสู่ระบบ (Login)</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
          ระบบประเมินผล (Eval DB)
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="เช่น emp1, boss, dir"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน (เช่น 1234)"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 rounded-lg p-3 text-xs ${
              message.isError
                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

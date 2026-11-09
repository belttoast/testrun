import { NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";
import jwt from "jsonwebtoken";

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  name: string;
  role: string;
  emp_score: number | null;
  boss_score: number | null;
  dir_score: number | null;
  file_url: string | null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body;

  try {
    const backendRes = await fetch("http://127.0.0.1:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(1500),
    });

    const data = await backendRes.json().catch(() => null);
    if (data) {
      return NextResponse.json(data, { status: backendRes.status });
    }
  } catch {}

  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3307,
      user: process.env.DB_USER || "devuser",
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "devpassword",
      database: process.env.DB_NAME || "eval_db",
      charset: "utf8mb4",
    });

    const [rows] = await db.query<UserRow[]>(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password]
    );
    await db.end();

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { status: 401, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", data: null },
        { status: 401 }
      );
    }

    const user = rows[0];
    const SECRET = process.env.JWT_SECRET || "jwt_secret";
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      SECRET,
      { expiresIn: "1d" }
    );

    return NextResponse.json({
      status: 200,
      message: "เข้าสู่ระบบสำเร็จ",
      data: { token, user },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Database connection failed";
    return NextResponse.json(
      {
        status: 500,
        message: `เชื่อมต่อฐานข้อมูลล้มเหลว: ${errorMsg}`,
        data: null,
      },
      { status: 500 }
    );
  }
}

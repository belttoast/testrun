# testrun

ระบบ Full-Stack: Next.js Frontend + Express.js Backend + MySQL/MariaDB (Eval DB)

## โครงสร้างโปรเจกต์
- `/frontend`: Next.js (App Router, Tailwind CSS)
- `/backend`: Express.js, MySQL2, JWT, Multer
- `database.sql`: ไฟล์ Database schema สำหรับ `eval_db`

## บัญชีผู้ใช้สำหรับทดสอบ (จาก database.sql)
| Username | Password | Role | ชื่อ-นามสกุล |
|---|---|---|---|
| `emp1` | `1234` | employee | สมชาย ใจดี |
| `emp2` | `1234` | employee | สมหญิง สดใส |
| `emp3` | `1234` | employee | ประสิทธิ์ ขยัน |
| `emp4` | `1234` | employee | วรรณา มีสุข |
| `boss` | `1234` | boss | หัวหน้าสมศักดิ์ |
| `dir` | `1234` | director | ผอ.เกรียงไกร |

## วิธีเริ่มรันระบบ

### 1. Backend (port 5000)
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (port 3000)
```bash
cd frontend
npm install
npm run dev
```
เปิดหน้าเว็บ: [http://localhost:3000](http://localhost:3000) หรือ [http://localhost:3000/login](http://localhost:3000/login)

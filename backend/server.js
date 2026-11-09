require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const SECRET = process.env.JWT_SECRET || 'jwt_secret';
const upload = multer({ dest: uploadDir });
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'devuser',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'devpassword',
  database: process.env.DB_NAME || 'eval_db',
  charset: 'utf8mb4'
});

// ฟังก์ชันส่ง Response มาตรฐาน { status, message, data }
const send = (res, status, message, data = null) => res.status(status).json({ status, message, data });

// Middleware ตรวจสอบ JWT
const auth = (req, res, next) => {
  try {
    req.user = jwt.verify(req.headers.authorization?.split(' ')[1], SECRET);
    next();
  } catch {
    send(res, 401, 'กรุณาเข้าสู่ระบบก่อนดำเนินการ');
  }
};

// 1. Login ออก JWT (POST)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (!rows.length) return send(res, 401, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    const token = jwt.sign({ id: rows[0].id, name: rows[0].name, role: rows[0].role }, SECRET, { expiresIn: '1d' });
    send(res, 200, 'เข้าสู่ระบบสำเร็จ', { token, user: rows[0] });
  } catch {
    send(res, 500, 'เชื่อมต่อฐานข้อมูลล้มเหลว');
  }
});

// 2. อัปโหลดไฟล์ (POST)
app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  req.file ? send(res, 200, 'อัปโหลดสำเร็จ', { url: req.file.filename }) : send(res, 400, 'ไม่พบไฟล์');
});

// 3. Dashboard ค้นหา + แบ่งหน้า (GET Query: search, page)
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const { search = '', page = 1 } = req.query;
    const limit = 3, offset = (Math.max(1, Number(page)) - 1) * limit;
    const [items] = await db.query(`
      SELECT id, name, emp_score, boss_score, dir_score, file_url,
        ROUND((COALESCE(emp_score,0)+COALESCE(boss_score,0)+COALESCE(dir_score,0))/3, 2) AS avg_score
      FROM users WHERE role = 'employee' AND name LIKE ? LIMIT ? OFFSET ?
    `, [`%${search}%`, limit, offset]);
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM users WHERE role = "employee" AND name LIKE ?', [`%${search}%`]);
    send(res, 200, 'สำเร็จ', { items, totalPages: Math.ceil(total / limit) || 1 });
  } catch {
    send(res, 500, 'ดึงข้อมูลไม่สำเร็จ');
  }
});

// 4. รายการรอประเมิน (GET Path: :role)
app.get('/api/pending/:role', auth, async (req, res) => {
  try {
    const sql = req.params.role === 'boss'
      ? 'SELECT id, name, emp_score, file_url FROM users WHERE role="employee" AND emp_score IS NOT NULL AND boss_score IS NULL'
      : 'SELECT id, name, emp_score, boss_score, file_url FROM users WHERE role="employee" AND boss_score IS NOT NULL AND dir_score IS NULL';
    const [rows] = await db.query(sql);
    send(res, 200, 'สำเร็จ', rows);
  } catch {
    send(res, 500, 'เกิดข้อผิดพลาด');
  }
});

// 5. บันทึกผลคะแนน (POST)
app.post('/api/evaluate', auth, async (req, res) => {
  try {
    const { id, role, score, file_url } = req.body || {};
    const col = role === 'employee' ? 'emp_score' : role === 'boss' ? 'boss_score' : 'dir_score';
    await db.query(`UPDATE users SET ${col} = ?, file_url = COALESCE(?, file_url) WHERE id = ?`, [score, file_url || null, id]);
    send(res, 200, 'บันทึกคะแนนเรียบร้อย');
  } catch {
    send(res, 500, 'บันทึกไม่สำเร็จ');
  }
});

// 6. แก้ไขข้อมูลและไฟล์แนบ (PUT)
app.put('/api/evaluate/:id', auth, async (req, res) => {
  try {
    const { score, file_url } = req.body || {};
    await db.query('UPDATE users SET emp_score = ?, file_url = COALESCE(?, file_url) WHERE id = ?', [score, file_url || null, req.params.id]);
    send(res, 200, 'แก้ไขข้อมูลเรียบร้อย');
  } catch {
    send(res, 500, 'แก้ไขไม่สำเร็จ');
  }
});

// 7. ลบข้อมูลคะแนน (DELETE)
app.delete('/api/evaluate/:id', auth, async (req, res) => {
  try {
    await db.query('UPDATE users SET emp_score = NULL, boss_score = NULL, dir_score = NULL, file_url = NULL WHERE id = ?', [req.params.id]);
    send(res, 200, 'ลบข้อมูลเรียบร้อย');
  } catch {
    send(res, 500, 'ลบไม่สำเร็จ');
  }
});

// 8. Export CSV
app.get('/api/export', auth, async (req, res) => {
  const [rows] = await db.query(`
    SELECT id, name, emp_score, boss_score, dir_score,
      ROUND((COALESCE(emp_score,0)+COALESCE(boss_score,0)+COALESCE(dir_score,0))/3, 2) AS avg_score
    FROM users WHERE role = 'employee' ORDER BY id ASC
  `);
  send(res, 200, 'สำเร็จ', rows);
});

// 9. Import CSV
app.post('/api/import', auth, async (req, res) => {
  try {
    const lines = (req.body.csv || '').trim().split('\n').slice(1);
    for (const line of lines) {
      const [id, name, emp, boss, dir] = line.split(',').map((s) => s?.trim());
      if (id && !isNaN(Number(id))) {
        await db.query('UPDATE users SET name=COALESCE(NULLIF(?,""), name), emp_score=NULLIF(?,""), boss_score=NULLIF(?,""), dir_score=NULLIF(?,"") WHERE id = ?', [name, emp, boss, dir, id]);
      }
    }
    send(res, 200, 'นำเข้าสำเร็จ');
  } catch {
    send(res, 500, 'นำเข้าไม่สำเร็จ');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

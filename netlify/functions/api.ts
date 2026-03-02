import express, { Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { neon } from "@neondatabase/serverless";

const app = express();

// Chấp nhận dữ liệu JSON gửi lên từ Frontend
app.use(express.json());

// Kết nối đến Database Neon (Lấy từ biến môi trường của Netlify)
const sql = neon(process.env.NETLIFY_DATABASE_URL!);

// Auth Middleware
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader === "Admin123") {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// --- API ROUTES ---

// 1. Lấy danh sách đề tài
app.get("/api/topics", async (req, res) => {
  try {
    const topics = await sql`SELECT * FROM topics ORDER BY id DESC`;
    res.json(topics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi cơ sở dữ liệu" });
  }
});

// 2. Thêm mới 1 đề tài
app.post("/api/topics", isAdmin, async (req, res) => {
  try {
    const { title, author, major, course, level } = req.body;
    const result = await sql`
      INSERT INTO topics (title, author, major, course, level) 
      VALUES (${title}, ${author}, ${major}, ${course}, ${level})
      RETURNING id
    `;
    res.json({ id: result[0].id });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lưu đề tài" });
  }
});

// 3. Cập nhật đề tài
app.put("/api/topics/:id", isAdmin, async (req, res) => {
  try {
    const { title, author, major, course, level } = req.body;
    await sql`
      UPDATE topics 
      SET title = ${title}, author = ${author}, major = ${major}, course = ${course}, level = ${level} 
      WHERE id = ${req.params.id}
    `;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi cập nhật đề tài" });
  }
});

// 4. Nhập hàng loạt đề tài (Bulk Import)
app.post("/api/topics/bulk", isAdmin, async (req, res) => {
  try {
    const topics = req.body;
    if (!Array.isArray(topics)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    // Chạy song song các lệnh insert cho danh sách lớn
    const promises = topics.map((item) => sql`
      INSERT INTO topics (title, author, major, course, level) 
      VALUES (${item.title}, ${item.author}, ${item.major}, ${item.course}, ${item.level})
    `);
    
    await Promise.all(promises);
    res.json({ success: true, count: topics.length });
  } catch (error) {
    console.error("Bulk Import Error:", error);
    res.status(500).json({ error: "Failed to import topics" });
  }
});

// 5. Xóa đề tài
app.delete("/api/topics/:id", isAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM topics WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa đề tài" });
  }
});

// 6. Lấy các cài đặt hệ thống
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await sql`SELECT * FROM settings`;
    const result = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy cài đặt" });
  }
});

// 7. Lưu/Cập nhật cài đặt hệ thống
app.post("/api/settings", isAdmin, async (req, res) => {
  try {
    const { ai_criteria } = req.body;
    // Postgres sử dụng ON CONFLICT để Insert hoặc Update
    await sql`
      INSERT INTO settings (key, value) 
      VALUES ('ai_criteria', ${ai_criteria})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lưu cài đặt" });
  }
});

// BỌC ỨNG DỤNG ĐỂ CHẠY TRÊN NETLIFY FUNCTIONS
export const handler = serverless(app);
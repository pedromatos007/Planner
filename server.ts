import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("planner.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    name TEXT,
    avatar_url TEXT
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    title TEXT,
    completed INTEGER,
    date TEXT,
    category TEXT,
    FOREIGN KEY(user_email) REFERENCES users(email)
  );
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    name TEXT,
    color TEXT,
    FOREIGN KEY(user_email) REFERENCES users(email)
  );
  CREATE TABLE IF NOT EXISTS habit_completions (
    habit_id TEXT,
    user_email TEXT,
    date TEXT,
    PRIMARY KEY (habit_id, date),
    FOREIGN KEY(user_email) REFERENCES users(email)
  );
  CREATE TABLE IF NOT EXISTS mood_entries (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    date TEXT,
    mood TEXT,
    note TEXT,
    FOREIGN KEY(user_email) REFERENCES users(email)
  );
  CREATE TABLE IF NOT EXISTS finance_entries (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    description TEXT,
    amount REAL,
    type TEXT,
    date TEXT,
    category TEXT,
    FOREIGN KEY(user_email) REFERENCES users(email)
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    title TEXT,
    message TEXT,
    type TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT,
    FOREIGN KEY(user_email) REFERENCES users(email)
  );
`);

// Migration: Add user_email column if missing (for existing databases)
const tables = ['tasks', 'habits', 'habit_completions', 'mood_entries', 'finance_entries'];
tables.forEach(table => {
  try {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    const hasUserEmail = columns.some((c: any) => c.name === 'user_email');
    if (!hasUserEmail) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN user_email TEXT`).run();
    }
  } catch (e) {
    console.log(`Migration skipped for ${table}:`, e);
  }
});

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  
  // Middleware to get user email from header
  const getUserEmail = (req: express.Request) => req.headers['x-user-email'] as string;

  // Users
  app.post("/api/login", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      db.prepare("INSERT INTO users (email, name, avatar_url) VALUES (?, ?, ?)")
        .run(email, email.split('@')[0], `https://picsum.photos/seed/${email}/200`);
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    }
    res.json(user);
  });

  app.get("/api/user", (req, res) => {
    const email = getUserEmail(req);
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    res.json(user);
  });

  app.patch("/api/user", (req, res) => {
    const email = getUserEmail(req);
    const { name, avatar_url } = req.body;
    db.prepare("UPDATE users SET name = ?, avatar_url = ? WHERE email = ?")
      .run(name, avatar_url, email);
    res.json({ success: true });
  });

  // Tasks
  app.get("/api/tasks", (req, res) => {
    const email = getUserEmail(req);
    const tasks = db.prepare("SELECT * FROM tasks WHERE user_email = ?").all(email);
    res.json(tasks.map((t: any) => ({ ...t, completed: !!t.completed })));
  });

  app.post("/api/tasks", (req, res) => {
    const email = getUserEmail(req);
    const { id, title, completed, date, category } = req.body;
    db.prepare("INSERT INTO tasks (id, user_email, title, completed, date, category) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, email, title, completed ? 1 : 0, date, category);
    res.status(201).json({ id });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const email = getUserEmail(req);
    const { completed } = req.body;
    db.prepare("UPDATE tasks SET completed = ? WHERE id = ? AND user_email = ?")
      .run(completed ? 1 : 0, req.params.id, email);
    res.json({ success: true });
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const email = getUserEmail(req);
    db.prepare("DELETE FROM tasks WHERE id = ? AND user_email = ?").run(req.params.id, email);
    res.json({ success: true });
  });

  // Habits
  app.get("/api/habits", (req, res) => {
    const email = getUserEmail(req);
    const habits = db.prepare("SELECT * FROM habits WHERE user_email = ?").all(email);
    const completions = db.prepare("SELECT * FROM habit_completions WHERE user_email = ?").all(email);

    const habitsWithCompletions = habits.map((h: any) => ({
      ...h,
      completedDates: completions
        .filter((c: any) => c.habit_id === h.id)
        .map((c: any) => c.date)
    }));

    res.json(habitsWithCompletions);
  });

  app.post("/api/habits", (req, res) => {
    const email = getUserEmail(req);
    const { id, name, color } = req.body;
    db.prepare("INSERT INTO habits (id, user_email, name, color) VALUES (?, ?, ?, ?)").run(id, email, name, color);
    res.status(201).json({ id });
  });

  app.delete("/api/habits/:id", (req, res) => {
    const email = getUserEmail(req);
    db.prepare("DELETE FROM habit_completions WHERE habit_id = ? AND user_email = ?").run(req.params.id, email);
    db.prepare("DELETE FROM habits WHERE id = ? AND user_email = ?").run(req.params.id, email);
    res.json({ success: true });
  });

  app.post("/api/habits/:id/toggle", (req, res) => {
    const email = getUserEmail(req);
    const { date } = req.body;
    const exists = db.prepare("SELECT 1 FROM habit_completions WHERE habit_id = ? AND date = ? AND user_email = ?")
      .get(req.params.id, date, email);

    if (exists) {
      db.prepare("DELETE FROM habit_completions WHERE habit_id = ? AND date = ? AND user_email = ?")
        .run(req.params.id, date, email);
    } else {
      db.prepare("INSERT INTO habit_completions (habit_id, user_email, date) VALUES (?, ?, ?)")
        .run(req.params.id, email, date);
    }
    res.json({ success: true });
  });

  // Mood
  app.get("/api/mood", (req, res) => {
    const email = getUserEmail(req);
    const entries = db.prepare("SELECT * FROM mood_entries WHERE user_email = ? ORDER BY date DESC").all(email);
    res.json(entries);
  });

  app.post("/api/mood", (req, res) => {
    const email = getUserEmail(req);
    const { id, date, mood, note } = req.body;
    db.prepare("INSERT INTO mood_entries (id, user_email, date, mood, note) VALUES (?, ?, ?, ?, ?)")
      .run(id, email, date, mood, note);
    res.status(201).json({ id });
  });

  app.delete("/api/mood/:id", (req, res) => {
    const email = getUserEmail(req);
    db.prepare("DELETE FROM mood_entries WHERE id = ? AND user_email = ?").run(req.params.id, email);
    res.json({ success: true });
  });

  // Finance
  app.get("/api/finance", (req, res) => {
    const email = getUserEmail(req);
    const entries = db.prepare("SELECT * FROM finance_entries WHERE user_email = ? ORDER BY date DESC").all(email);
    res.json(entries);
  });

  app.post("/api/finance", (req, res) => {
    const email = getUserEmail(req);
    const { id, description, amount, type, date, category } = req.body;
    db.prepare("INSERT INTO finance_entries (id, user_email, description, amount, type, date, category) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, email, description, amount, type, date, category);
    res.status(201).json({ id });
  });

  app.delete("/api/finance/:id", (req, res) => {
    const email = getUserEmail(req);
    db.prepare("DELETE FROM finance_entries WHERE id = ? AND user_email = ?").run(req.params.id, email);
    res.json({ success: true });
  });

  // Notifications
  app.get("/api/notifications", (req, res) => {
    const email = getUserEmail(req);
    const notifications = db.prepare("SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC").all(email);
    res.json(notifications.map((n: any) => ({ ...n, read: !!n.read })));
  });

  app.post("/api/notifications", (req, res) => {
    const email = getUserEmail(req);
    const { title, message, type } = req.body;
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO notifications (id, user_email, title, message, type, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, email, title, message, type, new Date().toISOString());
    res.status(201).json({ id });
  });

  app.patch("/api/notifications/:id/read", (req, res) => {
    const email = getUserEmail(req);
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_email = ?").run(req.params.id, email);
    res.json({ success: true });
  });

  app.delete("/api/notifications", (req, res) => {
    const email = getUserEmail(req);
    db.prepare("DELETE FROM notifications WHERE user_email = ?").run(email);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

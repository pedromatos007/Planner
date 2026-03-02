import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- BANCO DE DADOS ---
const db = new Database("planner.db");
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      name TEXT,
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      date TEXT,
      category TEXT,
      FOREIGN KEY(user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      FOREIGN KEY(user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS habit_completions (
      habit_id TEXT,
      user_email TEXT NOT NULL,
      date TEXT,
      PRIMARY KEY (habit_id, date),
      FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      FOREIGN KEY(user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mood_entries (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      date TEXT NOT NULL,
      mood TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finance_entries (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')),
      date TEXT NOT NULL,
      category TEXT,
      FOREIGN KEY(user_email) REFERENCES users(email) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_email) REFERENCES users(email) ON DELETE CASCADE
    );
  `);
}

initDb();

// --- MIDDLEWARES ---
const app = express();
app.use(express.json());
app.use(cors());

// Middleware para capturar o e-mail do usuário em todas as requisições
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const email = req.headers['x-user-email'] as string;
  if (!email && !req.path.startsWith('/api/login') && !req.path.startsWith('/@vite') && !req.path.startsWith('/src')) {
     // Em rotas de API que não sejam login, exige o e-mail
     if (req.path.startsWith('/api')) {
       return res.status(401).json({ error: "E-mail do usuário não fornecido" });
     }
  }
  (req as any).userEmail = email;
  next();
};

app.use(authMiddleware);

// --- ROTAS DA API ---

// Auth
app.post("/api/login", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "E-mail é obrigatório" });
  
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    db.prepare("INSERT INTO users (email, name, avatar_url) VALUES (?, ?, ?)")
      .run(email, email.split('@')[0], `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`);
    user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  }
  res.json(user);
});

// Tasks
app.get("/api/tasks", (req, res) => {
  const email = (req as any).userEmail;
  const tasks = db.prepare("SELECT * FROM tasks WHERE user_email = ? ORDER BY date ASC").all(email) as any[];
  res.json(tasks.map(t => ({ ...t, completed: !!t.completed })));
});

app.post("/api/tasks", (req, res) => {
  const email = (req as any).userEmail;
  const { title, date, category } = req.body;
  const id = randomUUID();
  db.prepare("INSERT INTO tasks (id, user_email, title, completed, date, category) VALUES (?, ?, ?, 0, ?, ?)")
    .run(id, email, title, date, category);
  res.status(201).json({ id });
});

app.delete("/api/tasks/:id", (req, res) => {
  const email = (req as any).userEmail;
  db.prepare("DELETE FROM tasks WHERE id = ? AND user_email = ?").run(req.params.id, email);
  res.json({ success: true });
});

// Finance
app.get("/api/finance", (req, res) => {
  const email = (req as any).userEmail;
  const entries = db.prepare("SELECT * FROM finance_entries WHERE user_email = ? ORDER BY date DESC").all(email);
  res.json(entries);
});

app.post("/api/finance", (req, res) => {
  const email = (req as any).userEmail;
  const { description, amount, type, date, category } = req.body;
  const id = randomUUID();
  db.prepare("INSERT INTO finance_entries (id, user_email, description, amount, type, date, category) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, email, description, amount, type, date, category);
  res.status(201).json({ id });
});

// --- VITE / ESTÁTICOS ---
async function startServer() {
  const PORT = process.env.PORT || 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Erro ao iniciar servidor:", err);
});

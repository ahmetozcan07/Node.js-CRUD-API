const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const port = 3000;

const swaggerUi = require('swagger-ui-express');
const openapiDocument = require('./openapi.json');

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

const db = new Database('tasks.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`).run();

// seed if table is empty
const rowCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
if (rowCount === 0) {
  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insert.run('Learn Node.js', 1);
  insert.run('Build a CRUD API', 0);
  insert.run('Test with Swagger', 0);
}


// Root Endpoint
app.get('/', (req, res) => {
  res.json({ 
    "name": "Task API", 
    "version": "1.0", 
    "endpoints": ["/tasks"] 
  });
});

// Health Endpoint
app.get('/health', (req, res) => {
  res.json({ "status": "ok" });
});

let tasks = [
  { id: 1, title: "Learn Node.js", done: true },
  { id: 2, title: "Build a CRUD API", done: false },
  { id: 3, title: "Test with Swagger", done: false }
];

// GET ENDPOINTS  =====================================================================================
// GET /tasks
app.get('/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks').all();
  const formattedTasks = tasks.map(t => ({ ...t, done: Boolean(t.done) }));
  res.json(formattedTasks);
});

// GET /tasks/:id
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  if (task) {
    res.json({ ...task, done: Boolean(task.done) });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
});

// POST ENDPOINT =====================================================================================
// POST /tasks
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const result = insert.run(title.trim(), 0);

  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    id: newTask.id,
    title: newTask.title,
    done: Boolean(newTask.done)
  });
});
// PUT ENDPOINT =====================================================================================
// PUT /tasks/:id
app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const { title, done } = req.body;

  if (Object.keys(req.body).length === 0 || (title !== undefined && title.trim() === "")) {
    return res.status(400).json({ error: "Invalid or empty body" });
  }

  const updatedTitle = title !== undefined ? title.trim() : task.title;
  const updatedDone = done !== undefined ? (done ? 1 : 0) : task.done;

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(updatedTitle, updatedDone, taskId);

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  res.json({ ...updatedTask, done: Boolean(updatedTask.done) });
});

// DELETE ENDPOINT =====================================================================================
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

  res.status(204).send();
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
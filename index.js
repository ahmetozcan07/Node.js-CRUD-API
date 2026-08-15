const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

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

// GET /tasks
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// GET /tasks/:id
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);

  if (task) {
    res.json(task);
  } else {
    // 404 if no task is found with the given id
    res.status(404).json({ error: `Task ${taskId} not found` });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
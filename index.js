require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const swaggerUi = require('swagger-ui-express');
const openapiDocument = require('./openapi.json');

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// seed if table is empty
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id serial primary key,
      title text,
      done boolean
    )
  `);

  const res = await pool.query('SELECT COUNT(*) as count FROM tasks');
  if (parseInt(res.rows[0].count) === 0) {
    const insertQuery = 'INSERT INTO tasks (title, done) VALUES ($1, $2)';
    await pool.query(insertQuery, ['Learn Node.js', true]);
    await pool.query(insertQuery, ['Build a CRUD API', false]);
    await pool.query(insertQuery, ['Test with Swagger', false]);
    console.log("Örnek görevler veritabanına eklendi.");
  }
};

initDB();


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

// PUBLIC & PROTECTED ENDPOINTS =======================================================================
// GET /public/info
app.get('/public/info', (req, res) => {
  res.status(200).json({ message: "Welcome stranger! This info is public." });
});

// GET /protected/profile
app.get('/protected/profile', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  res.status(200).json({ message: "You provided a token!"});
});

// AUTH ENDPOINTS =====================================================================================
// POST /auth/signup
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data.user);
});

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: "Invalid login credentials" });
  }

  res.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
});

// GET ENDPOINTS =====================================================================================
// GET /tasks
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tasks/:id
app.get('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST ENDPOINT =====================================================================================
// POST /tasks
app.post('/tasks', async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *',
      [title.trim(), false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT ENDPOINT =====================================================================================
// PUT /tasks/:id
app.put('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  const { title, done } = req.body;

  if (Object.keys(req.body).length === 0 || (title !== undefined && title.trim() === "")) {
    return res.status(400).json({ error: "Invalid or empty body" });
  }

  try {
    const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    const task = taskRes.rows[0];

    const updatedTitle = title !== undefined ? title.trim() : task.title;
    const updatedDone = done !== undefined ? done : task.done; 

    const result = await pool.query(
      'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *',
      [updatedTitle, updatedDone, taskId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ENDPOINT =====================================================================================
// DELETE /tasks/:id
app.delete('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);

  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [taskId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
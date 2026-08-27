# Basic Task CRUD API

Basic to-do list CRUD API using Node.js and Express.js, running on a real PostgreSQL database containerized with Docker.

## How to Install & Run 

This project runs the entire stack (API + Database) with a single Docker command.

1. First, create your environment file by copying the example provided:
   `cp .env.example .env` (or manually copy the contents of `.env.example` into a new `.env` file).
2. Start the application and the database together:

```bash
docker compose up
```
## Table of Endpoints

| Task           | HTTP method     | Endpoint       |
|:---------------|:----------------|:---------------|
| Get all tasks  | GET             | /tasks         |
| Get single task| GET             | /tasks/:id     |
| Add a new task | POST            | /tasks         |
| Update a task  | PUT             | /tasks/:id     |
| Delete a task  | DELETE          | /tasks/:id     |



## Example curl -i output
D:\Users\ozcan\OneDrive\Masaüstü\Node.js>curl -i http://localhost:3000/tasks
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 145
ETag: W/"91-5Bg0CZvGxiY7yvf1cVLoygo7CBg"
Date: Thu, 27 Aug 2026 00:11:19 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":1,"title":"Learn Node.js","done":true},{"id":2,"title":"Build a CRUD API","done":false},{"id":3,"title":"Test with Swagger","done":false}]


## Swagger screenshot
![](./SwaggerScreenshot.png)

## PostgreSQL Database Proof
![](./dockerScreenshot.png)
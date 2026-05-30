# AI Software Builder Backend

Backend MVP for an **AI Software Builder** web app.

Users submit a prompt describing a website/app idea. The backend creates a project, stores the prompt, starts a fake AI build process, saves plan/files/logs, returns status to the frontend, and supports deploy simulation.

## Tech stack

- Node.js
- Express.js
- MongoDB + Mongoose
- REST API
- Optional Server-Sent Events for realtime build logs/status
- JWT auth placeholder/optional feature

## Folder structure

```txt
backend/
├── package.json
├── .env.example
├── README.md
├── src/
│   ├── server.js
│   ├── app.js
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Project.js
│   │   ├── BuildLog.js
│   │   ├── ProjectFile.js
│   │   └── User.js
│   ├── routes/
│   │   ├── project.routes.js
│   │   ├── build.routes.js
│   │   ├── deploy.routes.js
│   │   └── auth.routes.js
│   ├── controllers/
│   │   ├── project.controller.js
│   │   ├── build.controller.js
│   │   ├── deploy.controller.js
│   │   └── auth.controller.js
│   ├── services/
│   │   ├── ai.service.js
│   │   ├── build.service.js
│   │   ├── log.service.js
│   │   ├── deploy.service.js
│   │   ├── payment.service.js
│   │   └── container.service.js
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   ├── notFound.middleware.js
│   │   └── auth.middleware.js
│   └── utils/
│       ├── asyncHandler.js
│       └── apiResponse.js
```

## Install

```bash
cd backend
npm install
```

## Setup environment variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Example `.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/ai_software_builder
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

## Run dev server

Make sure MongoDB is running, then:

```bash
npm run dev
```

Production-style run:

```bash
npm start
```

Health check:

```http
GET /api/health
```

## Project statuses

```txt
pending -> planning -> building -> ready -> deployed
failed
```

## API response format

Success:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Error message"
}
```

## API endpoints

### Create project

```http
POST /api/projects
```

Request:

```json
{
  "title": "Portfolio website",
  "prompt": "Build me a portfolio website for a photographer",
  "appType": "portfolio",
  "modelType": "balanced"
}
```

Response:

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "_id": "...",
      "title": "Portfolio website",
      "prompt": "Build me a portfolio website for a photographer",
      "appType": "portfolio",
      "modelType": "balanced",
      "status": "pending",
      "plan": [],
      "previewDescription": "",
      "previewUrl": "",
      "liveUrl": "",
      "errorMessage": "",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### Get all projects

```http
GET /api/projects
```

Response:

```json
{
  "success": true,
  "data": {
    "projects": []
  }
}
```

### Get one project

```http
GET /api/projects/:projectId
```

Response:

```json
{
  "success": true,
  "data": {
    "project": {}
  }
}
```

### Delete project

```http
DELETE /api/projects/:projectId
```

Response:

```json
{
  "success": true,
  "message": "Project deleted successfully",
  "data": {
    "projectId": "..."
  }
}
```

### Start build

```http
POST /api/projects/:projectId/start-build
```

Response:

```json
{
  "success": true,
  "message": "Build started",
  "data": {
    "projectId": "...",
    "status": "planning"
  }
}
```

Important: this endpoint returns immediately with HTTP `202`. The build continues asynchronously and updates the database step by step.

### Get logs

```http
GET /api/projects/:projectId/logs
```

Response:

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "...",
        "projectId": "...",
        "level": "info",
        "message": "Analyzing prompt...",
        "createdAt": "..."
      }
    ]
  }
}
```

### Get files

```http
GET /api/projects/:projectId/files
```

Response:

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "_id": "...",
        "projectId": "...",
        "path": "src/App.jsx",
        "language": "jsx",
        "content": "...",
        "createdAt": "..."
      }
    ]
  }
}
```

Fake generated files include at least:

- `package.json`
- `src/App.jsx`
- `src/main.jsx`
- `src/index.css`

### Get status

```http
GET /api/projects/:projectId/status
```

Response:

```json
{
  "success": true,
  "data": {
    "projectId": "...",
    "status": "ready",
    "previewUrl": "/preview/...",
    "liveUrl": "",
    "errorMessage": "",
    "updatedAt": "..."
  }
}
```

### Realtime events with SSE

```http
GET /api/projects/:projectId/events
```

Frontend example:

```js
const projectId = '...';
const events = new EventSource(`http://localhost:5000/api/projects/${projectId}/events`);

events.addEventListener('connected', (event) => {
  console.log('Connected:', JSON.parse(event.data));
});

events.addEventListener('status', (event) => {
  console.log('Status:', JSON.parse(event.data));
});

events.addEventListener('log', (event) => {
  console.log('Log:', JSON.parse(event.data));
});
```

### Deploy simulation

```http
POST /api/projects/:projectId/deploy
```

Response:

```json
{
  "success": true,
  "message": "Project deployed successfully",
  "data": {
    "status": "deployed",
    "liveUrl": "https://devflow-demo.app/project-name-abc123"
  }
}
```

The project must be in `ready` status before deploy simulation.

## Optional Auth APIs

### Register

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "Demo User",
  "email": "demo@example.com",
  "password": "123456"
}
```

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "demo@example.com",
  "password": "123456"
}
```

### Get current user

```http
GET /api/auth/me
Authorization: Bearer <token>
```

## Recommended frontend flow

1. User enters `title`, `prompt`, `appType`, `modelType`.
2. Frontend calls `POST /api/projects`.
3. Frontend receives `project._id`.
4. Frontend opens SSE stream: `GET /api/projects/:projectId/events`.
5. Frontend calls `POST /api/projects/:projectId/start-build`.
6. Frontend listens for `status` and `log` SSE events.
7. Frontend can also poll `GET /api/projects/:projectId/status` if SSE is not used.
8. When status is `ready`, frontend calls:
   - `GET /api/projects/:projectId/files`
   - `GET /api/projects/:projectId/logs`
9. User clicks Deploy.
10. Frontend calls `POST /api/projects/:projectId/deploy`.
11. Frontend displays `liveUrl`.

## How the AI teammate can replace fake AI service

The fake AI logic is isolated in:

```txt
src/services/ai.service.js
```

Current function:

```js
const generateProject = async (project) => {
  return {
    plan: [],
    files: [],
    previewDescription: ''
  };
};
```

The AI teammate should keep the same return shape:

```js
{
  plan: ["Step 1", "Step 2"],
  files: [
    {
      path: "src/App.jsx",
      language: "jsx",
      content: "..."
    }
  ],
  previewDescription: "..."
}
```

Later, they can call a real AI provider inside `generateProject`, but the rest of the backend does not need to change.

## Future feature stubs

These files are intentionally placeholders:

```txt
src/services/payment.service.js
src/services/container.service.js
src/services/deploy.service.js
```

Rules for MVP:

- Do not call a real AI API yet.
- Do not implement real payment.
- Do not implement real deployment.
- Do not execute untrusted generated code in a real container.

## Quick curl test

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Portfolio website",
    "prompt":"Build me a portfolio website for a photographer",
    "appType":"portfolio",
    "modelType":"balanced"
  }'
```

Then copy the returned project `_id`:

```bash
curl -X POST http://localhost:5000/api/projects/<PROJECT_ID>/start-build
curl http://localhost:5000/api/projects/<PROJECT_ID>/status
curl http://localhost:5000/api/projects/<PROJECT_ID>/logs
curl http://localhost:5000/api/projects/<PROJECT_ID>/files
curl -X POST http://localhost:5000/api/projects/<PROJECT_ID>/deploy
```

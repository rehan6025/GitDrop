# GitDrop

A self-hostable deployment automation backend that connects your GitHub repositories to a live deployment pipeline — triggered via OAuth, queued via Redis, and persisted in PostgreSQL.

Built with **NestJS** · **TypeScript** · **Prisma** · **BullMQ** · **Docker**

---

## What It Does

GitDrop lets users authenticate with GitHub (OAuth), select a repository and branch, and trigger a deployment. The deployment request is pushed onto a Redis-backed **BullMQ queue**, where a separate worker process picks it up, runs the build, and tracks its status in a PostgreSQL database.

```
Client → Auth (GitHub OAuth) → POST /deployment
       → BullMQ Queue (Redis) → Worker Process
       → PostgreSQL (status tracking)
```

---

## Tech Stack

| Layer        | Technology                     |
|--------------|-------------------------------|
| Framework    | NestJS (Node.js + TypeScript)  |
| Database     | PostgreSQL via Prisma ORM      |
| Queue        | BullMQ + Redis                 |
| Auth         | GitHub OAuth + JWT (cookies)   |
| Containers   | Docker + Docker Compose        |
| Testing      | Vitest (unit), Jest (e2e)      |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### 1. Clone & Install

```bash
git clone https://github.com/your-username/git-drop.git
cd git-drop
npm install
```

### 2. Configure Environment

```bash
cp confSample.txt .env
# Fill in your GitHub OAuth credentials, DB URL, JWT secret, etc.
```

### 3. Start Infrastructure (Postgres + Redis)

```bash
docker compose up -d
```

### 4. Run Migrations & Start

```bash
npx prisma migrate dev
npm run start:dev
```

The API server starts on `http://localhost:3000`.  
The worker process runs separately via `node dist/src/worker.main.js`.

---

## Docker

A `Dockerfile` is included that builds the app and starts both the API server and the BullMQ worker in a single container:

```bash
docker build -t git-drop .
docker run -p 3000:3000 --env-file .env git-drop
```

For full local stack (app + postgres + redis), uncomment the `backend` service in `docker-compose.yaml`.

---

## Key API Endpoints

| Method | Endpoint                              | Description                      |
|--------|---------------------------------------|----------------------------------|
| GET    | `/auth/github`                        | Initiate GitHub OAuth flow       |
| GET    | `/auth/github/callback`               | OAuth callback, sets JWT cookie  |
| GET    | `/auth/me`                            | Returns current authenticated user |
| POST   | `/auth/logout`                        | Clears JWT cookie                |
| GET    | `/github/repos`                       | List user's GitHub repositories  |
| GET    | `/github/repos/:owner/:repo/branches` | List branches for a repo         |
| POST   | `/deployment`                         | Enqueue a new deployment         |
| GET    | `/projects`                           | List all projects for the user   |
| GET    | `/projects/:id/deployments`           | List deployments for a project   |

See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) for full request/response details.

---

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

---

## Project Structure

```
src/
├── auth/          # GitHub OAuth, JWT strategy, guards
├── github/        # GitHub API integration (repos, branches)
├── deployment/    # Deployment enqueueing & status
├── projects/      # Project & deployment listing
├── sandbox/       # Worker/queue sandbox utilities
├── prisma/        # Prisma service
└── worker.main.ts # BullMQ worker entrypoint
```

---

## License

MIT

# 2-Day Backend Skill Upgrade Plan (4h + 4–5h)

Here’s how I’d use this project to level up your backend skills over the next ~2 days.

---

# 🔥 High-Leverage Areas in This Project

## 1) Finish the Core Feature Set Around Deployments

- Add a **“list my projects”** endpoint:  
  `GET /projects`  
  Returns all projects for the authenticated user.

- Add a **“list deployments for a project”** endpoint:  
  `GET /projects/:projectId/deployments`

- Add a **“get single deployment status”** endpoint:  
  `GET /deployments/:id`

- Wire them into your existing Prisma models:
  - `User`
  - `Projects`
  - `Deployments`

This forces you to:

- Design proper DTOs
- Think about filters
- Create clean response shapes

---

## 2) Make Auth More Complete

- Add `GET /auth/me`  
  Returns the current user (from JWT payload + DB).

- Add `POST /auth/logout`  
  Clears the `jwt` cookie.

Practice:

- NestJS guards
- Decorators (`@Req()`, or a custom `@User()` decorator)
- Cookie handling

---

## 3) Add Validation & DTOs

Use:

- `class-validator`
- `class-transformer`
- Nest’s `ValidationPipe`

Create DTOs for:

`POST /deployment`

- Validate:
  - `name`
  - `repoUrl`
  - `branch`
  - `type`
  - `buildCommand`

This teaches:

- Clean input validation
- Proper error messages
- Safer APIs

---

## 4) Improve Observability

### Logging

Add structured logs around:

- Deployment enqueueing
- GitHub API calls (success + failure)

### Error Handling

- Create a simple **global exception filter**
- Format errors consistently

### Optional

- Add request logging middleware:
  - method
  - path
  - status
  - duration

---

## 5) Testing

### Unit Tests

- `AuthService.callback` (mock axios + Prisma)
- `GithubService.getRepos`
- `GithubService.getBranches`
- `DeploymentService.enqueueDeployment` (mock Bull queue + Prisma)

### E2E Tests

- `/deployment` happy path  
  (Use fake auth guard or bypass)

---

## 6) Security / Robustness

- Review `AuthGuard`
- Add basic rate limiting (Nest throttle) to:
  - `/auth/*`
  - `/github/*`

- Ensure:
  - GitHub errors don’t leak sensitive info
  - Queueing errors are safe

- Consider failure scenarios:
  - What if Redis is down?
  - What if Postgres is down?
  - Add defensive checks + clean error responses

---

# 📅 Plan for Today (4 Hours)

## Hour 1–2: Projects & Deployments Endpoints

- Create `ProjectsController` + `ProjectsService`
- Implement:
  - `GET /projects` (auth required)
  - `GET /projects/:projectId/deployments` (auth required)
- Reuse existing Prisma relations

---

## Hour 2–3: Auth Utilities

- Implement `GET /auth/me`
  - Read user from JWT
  - Fetch full user from DB

- Implement `POST /auth/logout`
  - Clear `jwt` cookie
  - Use proper cookie options

- Update `API_DOCUMENTATION.md`

---

## Hour 3–4: DTOs + Validation

- Add `CreateDeploymentDto`
- Enable global `ValidationPipe` in `main.ts`
- Refactor `POST /deployment` to use DTO instead of raw `request.body`

---

# 📅 Plan for Tomorrow (4–5 Hours)

## Hour 1–2: Observability

- Add logging in:
  - `AuthService`
  - `GithubService`
  - `DeploymentService`

- Add:
  - Global exception filter  
    OR
  - At least consistent error responses

- Optional: request logging middleware

---

## Hour 2–3: Tests

Write unit tests for services modified today:

Start with:

- `DeploymentService.enqueueDeployment`
- `GithubService.getRepos`

---

## Hour 3–4 (or 5): Security & Polish

- Add rate limiting to:
  - `/auth/*`
  - `/github/*`

- Review:
  - CORS config
  - Cookie security options
  - Production settings

- Clean up `API_DOCUMENTATION.md`  
  Reflect all new endpoints and behaviors

---

If you tell me which item you want to start with, I can walk you step-by-step (or even write the NestJS code) for that piece.

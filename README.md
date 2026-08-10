# Unny — Backend

Backend API for **Unny**, a final year project archive and collaboration platform.
Students submit projects for supervisor review; approved projects join a searchable
public archive other students can explore.

## Stack

| Concern            | Choice                                            |
| ------------------- | -------------------------------------------------- |
| Runtime              | Node.js (ESM), Express 5                            |
| Database             | PostgreSQL via Prisma 7                             |
| Auth                  | JWT access + refresh tokens (rotated, revocable)    |
| File storage          | S3-compatible object storage, presigned URLs        |
| Real-time             | `ws` WebSocket server for live notifications        |
| Push notifications    | Firebase Admin (FCM), optional                      |
| Document generation   | `docx` — auto-generated approval certificates       |
| Validation            | `express-validator`                                 |

## Architecture — MVC

The API follows MVC with an explicit service layer between controllers and
persistence, which keeps controllers thin and business rules unit-testable
without an HTTP context:

```
Routes  →  Middleware (auth/role/validate)  →  Controllers  →  Services  →  Prisma (Models)
```

- **Models** — `prisma/schema.prisma` is the single source of truth for the data
  model. Prisma's generated client is the data-access layer; domain rules that
  don't belong in the schema live in `src/services/*`.
- **Views** — this is a headless JSON API; the "view" layer is the consistent
  response envelope produced by `src/utils/ApiResponse.js`
  (`{ success, message, data, meta }`), consumed by the React Native client.
- **Controllers** — `src/controllers/*` only parse the request, call a service,
  and shape the response. No business logic lives here.

```
unny-backend/
├── prisma/
│   ├── schema.prisma        # Data model (see below)
│   └── seed.js               # Baseline tag taxonomy
├── src/
│   ├── config/                # env, prisma client, S3 client, firebase-admin
│   ├── controllers/            # Thin request/response handlers
│   ├── services/                # Business logic, one file per domain
│   ├── routes/                   # Express routers, wiring middleware→controller
│   ├── middleware/                # authGuard, roleGuard, validate, errorHandler, rateLimiter
│   ├── validators/                 # express-validator chains per route group
│   ├── sockets/                     # WebSocket server (real-time notifications)
│   └── app.js                        # Express app assembly
└── server.js                          # HTTP + WS server bootstrap, graceful shutdown
```

## Data model

Two roles: `STUDENT` and `SUPERVISOR`, sharing a `User` + `Profile` table
(role-specific fields — `matricNumber`/`level` vs `staffId`/`specialization` —
are nullable and only populated for the relevant role).

Key entities:

- **Project** — owned by a student (`submittedById`), optionally has an
  assigned `supervisorId`, moves through `DRAFT → PENDING_REVIEW → APPROVED | REJECTED`.
- **ProjectCollaborator** — students collaborating on the same project; invite
  → accept/decline flow, with an `OWNER` role for the original submitter.
- **SupervisionRequest** — a student requests a specific supervisor for a
  project; on acceptance the project's `supervisorId` is set, which is what
  unlocks submission for review.
- **Review** — an auditable log of every supervisor action (`APPROVED` /
  `REJECTED` / `COMMENTED`) on a project, separate from the project's current
  `status` so the history is never lost.
- **Tag** / **ProjectTag** — faceted search (language, framework, domain, tool,
  methodology).
- **Comment**, **Bookmark** — lightweight engagement on the public archive.
- **Notification**, **DeviceToken** — in-app + push notification fan-out.
- **RefreshToken** — hashed, revocable, rotated on every refresh (never store
  raw refresh tokens).

Run `npx prisma format` after edits and keep migrations in source control —
see Setup below.

## Setup

```bash
cp .env.example .env      # fill in DATABASE_URL, JWT secrets, AWS/S3, Firebase (optional)
npm install
npm run prisma:generate
npm run prisma:migrate    # creates the initial migration + applies it locally
npm run seed               # optional: seeds a starter tag list
npm run dev                 # nodemon, http://localhost:5000
```

Production:

```bash
npm ci
npm run prisma:generate
npm run prisma:deploy      # applies committed migrations, no interactive prompts
npm start
```

## Auth flow

1. `POST /api/v1/auth/register` (or `/login`) → `{ accessToken, refreshToken, user }`.
2. Send `Authorization: Bearer <accessToken>` on subsequent requests.
3. Access tokens are short-lived (15 min default). When expired, call
   `POST /api/v1/auth/refresh` with the refresh token to rotate both tokens.
4. `POST /api/v1/auth/logout` revokes the refresh token server-side.

Refresh tokens are stored **hashed** (`refresh_tokens` table) so a leaked DB
dump doesn't hand out working tokens, and each refresh **rotates** the token
(old one is marked revoked) to limit replay if one leaks.

## File uploads (project reports, avatars)

The client never uploads binary data through the API server. Flow:

1. `POST /api/v1/uploads/project-file` (student, owner) → `{ uploadUrl, key }`.
2. Client `PUT`s the PDF directly to `uploadUrl` (time-limited, presigned).
3. `POST /api/v1/projects/:id/submit` once metadata + file are complete.

Same pattern for `POST /api/v1/uploads/avatar`, followed by
`PATCH /api/v1/users/me { avatarUrl }`.

## Real-time notifications

Connect to `wss://<host>/ws?token=<accessToken>`. Every notification created
via `notification.service.js` is persisted, pushed over this socket if the
user is online, and sent via FCM if a device token is registered — so a
supervisor sees a new submission the instant it happens, not just on refresh.

## API surface (v1, base path `/api/v1`)

| Method & Path                                             | Auth        | Purpose                                   |
| ------------------------------------------------------------ | ------------ | ------------------------------------------- |
| POST `/auth/register`                                          | —            | Create account (student or supervisor)      |
| POST `/auth/login`                                              | —            | Login                                        |
| POST `/auth/refresh`                                             | —            | Rotate access/refresh token pair             |
| POST `/auth/logout`                                               | —            | Revoke refresh token                          |
| GET `/auth/me`                                                     | JWT         | Current user id/role                           |
| GET / PATCH `/users/me`                                              | JWT         | View / edit own profile                          |
| GET `/users/supervisors`                                              | JWT         | Browse supervisors (search/filter)                |
| GET `/users/:id`                                                       | JWT         | Public profile                                       |
| POST `/projects`                                                        | Student     | Create a draft project                                 |
| GET `/projects/explore`                                                  | —            | Search/browse the approved public archive               |
| GET `/projects/mine`                                                      | JWT         | Projects you own or collaborate on                        |
| GET `/projects/review-queue`                                               | Supervisor  | Projects pending your review                                |
| GET `/projects/:id`                                                         | JWT         | Project detail                                                |
| PATCH `/projects/:id`                                                        | Owner/collab | Edit a draft/rejected project                                 |
| DELETE `/projects/:id`                                                        | Owner       | Delete a draft project                                          |
| POST `/projects/:id/submit`                                                     | Owner       | Submit for supervisor review                                      |
| POST `/projects/:id/comments`                                                    | JWT         | Discussion comment                                                  |
| POST `/projects/:id/bookmark`                                                     | JWT         | Toggle bookmark                                                        |
| GET `/projects/bookmarks`                                                          | JWT         | Your bookmarked projects                                                 |
| GET/POST `/projects/:projectId/collaborators`                                        | Owner/JWT   | List / invite collaborators                                                |
| PATCH `/collaboration-invites/:id`                                                      | Invitee     | Accept/decline a collaboration invite                                        |
| POST `/projects/:projectId/supervision-requests`                                          | Student     | Request a supervisor                                                            |
| GET `/supervision-requests/mine`                                                            | JWT         | Your sent/received requests                                                        |
| PATCH `/supervision-requests/:id`                                                              | Supervisor  | Accept/decline a supervision request                                                 |
| GET/POST `/projects/:projectId/reviews`                                                          | JWT/Supervisor | Review history / submit approve-reject-comment decision                         |
| GET `/tags`, POST `/tags`                                                                          | —/JWT       | Tag taxonomy for search facets                                                       |
| GET `/notifications`, PATCH `/notifications/:id/read`                                                | JWT         | In-app notification center                                                             |
| POST `/uploads/project-file`, POST `/uploads/avatar`                                                   | JWT         | Presigned S3 upload URLs                                                                  |

Every response follows `{ success, message, data?, meta? }`; validation and
domain errors return `{ success: false, message, details? }` with the
appropriate HTTP status.

## Production notes

- **Rate limiting** ships as a simple in-memory limiter
  (`src/middleware/rateLimiter.middleware.js`) — fine for a single instance.
  Behind a load balancer with multiple replicas, swap it for a Redis-backed
  limiter so limits are enforced cluster-wide.
- **Search** uses case-insensitive `contains` matching for portability. At
  scale, add a `tsvector` column + GIN index and switch
  `project.service.js#exploreProjects` to `to_tsvector(...) @@ plainto_tsquery(...)`
  for ranked full-text search.
- **WebSocket fan-out** is in-memory per instance
  (`src/services/websocket.service.js`). For horizontal scaling, back it with
  Redis pub/sub so a notification created on one instance reaches a socket
  held open on another.
- **Migrations** should always be generated in dev (`prisma migrate dev`),
  committed, and applied in CI/CD with `prisma migrate deploy` — never run
  `migrate dev` against production.
- **Testing**: the service layer is decoupled from Express, so unit tests can
  call `src/services/*` directly against a test database or a mocked Prisma
  client; add integration tests against the route layer for contract
  coverage with the mobile client.

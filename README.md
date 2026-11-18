# Gather — Event Discovery & Registration

Gather is a full-stack event management application. Visitors can discover events, review pass options, reserve a place, and retrieve registration details with an entry QR code. Administrators can manage events and passes, review registrations, restore trashed records, and scan QR codes at entry.

The repository contains a React single-page application and a NestJS REST API backed by PostgreSQL.

## Contents

- [Features](#features)
- [Application panels and routes](#application-panels-and-routes)
- [Architecture and modules](#architecture-and-modules)
- [Technology stack](#technology-stack)
- [Data model](#data-model)
- [Requirements](#requirements)
- [Clone and local setup](#clone-and-local-setup)
- [Environment variables](#environment-variables)
- [Run with Docker Compose](#run-with-docker-compose)
- [Useful commands](#useful-commands)
- [API overview](#api-overview)
- [Testing and quality](#testing-and-quality)
- [Deployment notes](#deployment-notes)

## Features

### Visitor experience

- Browse events and search by event name or location.
- Filter the event list by location and view event dates, descriptions, and venues.
- Open event details and compare available pass types, prices, inclusions, and remaining capacity.
- Create an account with email/phone OTP verification and sign in with email and password.
- Request a password reset.
- Reserve passes for an event and review registrations in **My events**.
- View registration and attendee details, including the QR code used for check-in.
- View and update profile details.
- Install the client as a progressive web app (PWA).

### Event operations

- View event and registration summaries from the administrator overview.
- Create and edit events, and create, update, and manage pass capacity and pricing.
- View all registrations or registrations for a particular event.
- Inspect individual registration details.
- Move events, passes, and registrations to the trash; restore them or permanently delete them.
- Scan a visitor's registration QR code or enter its token for verification.
- Review the aggregate scan count.

### Important implementation notes

- OTP delivery is **not configured**. In non-production mode, the API returns OTP codes to support local development. In production mode, signup and password recovery report that OTP delivery is unavailable. Configure a delivery provider before using these flows in production.
- The payment endpoint is a **demo confirmation flow**, not a payment gateway. It marks a registration as confirmed only outside production and is explicitly disabled in production.
- This repository does not include an administrator account bootstrap script. An administrator account must be provisioned through your trusted deployment/database process.

## Application panels and routes

The client uses React Router browser-history routes. The static host must serve `index.html` for unknown paths so nested links and refreshes continue to work.

| Route | Panel / purpose | Access |
| --- | --- | --- |
| `/` | Event discovery and visitor portal | Public |
| `/events/:eventId` | Event details and pass selection | Public |
| `/my-events` | Visitor registrations | Signed-in |
| `/registrations/:registrationId` | Visitor registration details and entry QR | Signed-in |
| `/profile` | Visitor profile | Signed-in |
| `/admin` | Administrator overview | Administrator |
| `/admin/events` | Event and pass management | Administrator |
| `/admin/registrations` | Registration list | Administrator |
| `/admin/registrations/:registrationId` | Registration details | Administrator |
| `/admin/events/:eventId/registrations` | Registrations for one event | Administrator |
| `/admin/trash` | Restore or permanently delete records | Administrator |
| `/admin/scanner` | QR check-in scanner | Administrator |

The UI also redirects supported legacy query-string page URLs to their path-based equivalents. An administrator can use `?mode=admin` to view the visitor experience without losing the administrator session.

## Architecture and modules

```text
client/  React SPA, routed visitor and administrator views
backend/ NestJS REST API, authentication, business logic, and persistence
PostgreSQL  Event, pass, user, OTP, and registration data
```

### Client

The client keeps the UI, stateful workflows, and HTTP calls in separate layers:

- `src/views/` — visitor portal, administrator workspace, scanner, and shared input views.
- `src/controllers/` — React hooks coordinating route state, API requests, session state, and panel actions.
- `src/models/` — HTTP request helper and visitor/administrator API methods.
- `src/utils/` — shared client-side helpers, including name sanitization.
- `src/App.jsx` — route validation, legacy route redirects, and visitor/admin panel selection.

### Backend

NestJS modules group API and domain behavior:

- **Auth** (`auth/`) — signup OTP flow, login, registration completion, and password recovery. Passport guards and JWT strategies distinguish visitor, administrator, and registration flows.
- **Users** (`users/`) — profile and registered-event endpoints.
- **Events** (`events/`) — event and pass management, event registrations, dashboard summary, soft deletion and restoration, QR verification, and scan counts.
- **OTP** (`otp/`) — OTP records, expiry checks, verification, and registration tokens.
- **Payment** (`payment/`) — development-only confirmation of a visitor's pending registration.
- **Admin** (`admin/`) — administrator-only API entry point.
- **JWT** (`jwt/`) — separate token services for visitors, administrators, and registration completion.
- **Common** (`common/`) — shared services and validation.
- **Migrations** (`migrations/`) — TypeORM schema migration files.

The application bootstrap applies CORS and a global validation pipe that transforms DTOs, removes unknown fields, and rejects non-whitelisted fields.

## Technology stack

| Area | Technologies |
| --- | --- |
| Client | React 19, JavaScript, JSX, React Router 7 |
| Client tooling | Vite 8, ESLint |
| PWA and QR | `vite-plugin-pwa`, `qrcode.react`, `html5-qrcode` |
| API | Node.js, NestJS 12, TypeScript 6 |
| API validation and auth | `class-validator`, `class-transformer`, Passport, JWT, bcrypt |
| Persistence | PostgreSQL, TypeORM, `pg` |
| Testing | Vitest, NestJS testing utilities, Supertest |
| Containers | Docker, Docker Compose |
| Optional database workflow | Neon project configuration is present in `neon.ts` |

The backend is written in TypeScript with strict compiler options. The client is JavaScript/JSX; it does not currently define TypeScript types. Backend DTO classes define and validate incoming request shapes, and TypeORM entity classes describe persisted records and relations.

## Data model

- **User** — email, phone, password hash, profile fields, verification flags, and role.
- **Event** — name, description, location, start/end timestamps, active state, and soft-delete timestamp.
- **EventPass** — event relationship, name, price, capacity, sold count, description, active state, and soft-delete metadata.
- **EventRegistration** — attendee and user details, event/pass relationships, quantity, selected date, amount, status, QR token, check-in state, scan count, and historical event/pass snapshots.
- **Otp** — email/phone, code, purpose, verification state, and expiry.

Registrations keep event and pass snapshots so that historical details can still be displayed if the related event or pass is removed.

## Requirements

- Node.js 22.x and npm
- PostgreSQL (local, containerized, or managed)
- Git
- Docker Desktop / Docker Compose, if using the container setup

## Clone and local setup

### 1. Clone the repository

```bash
git clone https://github.com/harishauthzen/VisitorApp.git
cd VisitorApp
```

### 2. Configure PostgreSQL and backend environment

Create `backend/.env` for local development. Replace the example JWT values with long, unique random secrets.

```dotenv
NODE_ENV=development
PORT=3000

# Local PostgreSQL. Create this database and user before starting the API.
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=change-me
DB_DATABASE=gather

# Required by the authentication strategies/token services.
USER_JWT_SECRET=replace-with-a-long-random-secret
ADMIN_JWT_SECRET=replace-with-a-different-long-random-secret
REGISTER_JWT_SECRET=replace-with-another-long-random-secret

# Configure these with your NestJS Observe credentials.
OBSERVE_APP_KEY=your-observe-app-key
OBSERVE_APP_SECRET=your-observe-app-secret
```

Alternatively, set `DATABASE_URL` instead of the individual `DB_*` values:

```dotenv
DATABASE_URL=postgresql://postgres:change-me@localhost:5432/gather
```

The Nest application loads `../.env.local` and `backend/.env` when started from the backend directory. Do not commit credentials or real secret values.

### 3. Install and start the API

```bash
cd backend
npm ci
npm run start:dev
```

The API listens on `http://localhost:3000` by default.

### 4. Configure and start the client

Open a second terminal at the repository root and create `client/.env`:

```dotenv
VITE_API_URL=http://localhost:3000
```

Then install dependencies and start Vite:

```bash
cd client
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

### 5. Optional: seed sample events

With PostgreSQL configured and reachable by the backend, open a terminal in `backend` and run:

```bash
npm run seed:events
```

This builds the backend and inserts ten sample upcoming events, each with three pass tiers. Existing events with the same names are skipped.

## Environment variables

| Variable | Used by | Description |
| --- | --- | --- |
| `VITE_API_URL` | Client | Base URL of the NestJS API; no trailing slash is required by the client. |
| `DATABASE_URL` | Backend | PostgreSQL connection string; takes precedence over the individual `DB_*` settings. |
| `DATABASE_URL_UNPOOLED` | TypeORM CLI | Optional direct PostgreSQL connection used by the migration data source; falls back to `DATABASE_URL`. |
| `DB_HOST` | Backend | PostgreSQL host when `DATABASE_URL` is not set. |
| `DB_PORT` | Backend | PostgreSQL port; defaults to `5432` for the TypeORM CLI data source. |
| `DB_USERNAME` | Backend | PostgreSQL username. |
| `DB_PASSWORD` | Backend | PostgreSQL password. |
| `DB_DATABASE` | Backend | PostgreSQL database name. |
| `USER_JWT_SECRET` | Backend | Signing/verification secret for visitor tokens. |
| `ADMIN_JWT_SECRET` | Backend | Signing/verification secret for administrator tokens. |
| `REGISTER_JWT_SECRET` | Backend | Secret for signup completion tokens. |
| `PORT` | Backend | HTTP port; defaults to `3000`. |
| `NODE_ENV` | Backend | Production mode disables demo OTP responses and demo payment confirmation. |
| `OBSERVE_APP_KEY` | Backend | NestJS Observe instrumentation application key. |
| `OBSERVE_APP_SECRET` | Backend | NestJS Observe instrumentation application secret. |

TypeORM synchronization is currently enabled by the application module for runtime entity changes. Review and replace this strategy with a controlled migration process before production use.

## Run with Docker Compose

The Compose file starts PostgreSQL and the backend. From `backend/`, create `.env` with the JWT and Observe settings shown above, and use the Compose service hostname for the database:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/myapp
USER_JWT_SECRET=replace-with-a-long-random-secret
ADMIN_JWT_SECRET=replace-with-a-different-long-random-secret
REGISTER_JWT_SECRET=replace-with-another-long-random-secret
OBSERVE_APP_KEY=your-observe-app-key
OBSERVE_APP_SECRET=your-observe-app-secret
```

Start the services from the `backend/` directory:

```bash
docker compose up --build
```

The API is exposed on port `3000`; PostgreSQL is exposed on port `5432`. The Compose configuration persists database files in the `postgres_data` named volume. The frontend is not included in this Compose setup; run it separately using the client steps above and set `VITE_API_URL=http://localhost:3000`.

## Useful commands

Run commands from the indicated package directory.

### Backend (`backend/`)

| Command | Description |
| --- | --- |
| `npm run start:dev` | Start NestJS in watch mode. |
| `npm run start` | Start NestJS normally. |
| `npm run build` | Compile the backend to `dist/`. |
| `npm run start:prod` | Start the compiled backend. |
| `npm run seed:events` | Build and seed sample events. |
| `npm test` | Run backend unit tests with Vitest. |
| `npm run test:e2e` | Run backend end-to-end tests. |
| `npm run test:cov` | Run tests with coverage. |
| `npm run lint` | Lint backend source and tests with Oxlint. |
| `npm run format` | Format backend TypeScript files with Prettier. |

### Client (`client/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build static production assets into `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Lint client files with ESLint. |

## API overview

The backend is a JSON REST API. Protected endpoints require a bearer token in the `Authorization` header.

| Prefix | Purpose | Access |
| --- | --- | --- |
| `/auth` | Signup OTP, signup completion, login, forgot password, and reset password | Public, with a registration token for signup completion |
| `/events` | Public event listing/details; admin event/pass management, registrations, trash, summary, and QR operations | Public reads; administrator or signed-in visitor depending on operation |
| `/user` | Profile, profile updates, and registered-event details | Signed-in visitor or administrator |
| `/payment` | Demo registration payment confirmation and lookup | Signed-in visitor or administrator |
| `/admin` | Administrator API check | Administrator |

Common event operations include `GET /events`, `GET /events/:id`, `POST /events/:id/register`, administrator event/pass CRUD and restore endpoints, `POST /events/registrations/verify-qr`, and `GET /events/registrations/scan-count`. See the controllers under `backend/src/` for request DTOs, exact methods, and authorization guards.

## Testing and quality

Backend unit and e2e tests are run with Vitest. Client linting and production builds are provided by ESLint and Vite. Run the relevant package commands above after making changes.

## Deployment notes

- Deploy the client as a static SPA and configure history fallback to `index.html`. The included `client/vercel.json` provides a rewrite for Vercel deployments.
- Deploy the API with a reachable PostgreSQL database and set the required runtime environment variables. Configure CORS to the intended production client origin instead of relying on the current permissive development configuration.
- Configure a real OTP delivery provider and a real payment integration before enabling signup recovery or payments in production.
- Do not use the example Compose credentials or sample JWT values in production.
- Review database schema synchronization, migrations, secrets, and observability configuration as part of production hardening.


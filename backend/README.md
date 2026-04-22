# Mini ERP — backend (P0)

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` — required for `migrate`, `seed`, and `npm run start` (Prisma connects on app startup).
- `JWT_SECRET` — required for P1+ auth (`POST /auth/login`, `GET /auth/me`).

## Database

```bash
npm run db:deploy
npm run db:seed
```

## Run

```bash
npm run start:dev
```

- Health check (no database query): `GET /health` → `{ "status": "ok" }`

## Auth (P1)

- `POST /auth/login` — body `{ "email", "password" }` → `{ "access_token" }` (JWT, `expiresIn: '1d'`, payload `sub` + `role`).
- `GET /auth/me` — header `Authorization: Bearer <token>` → `{ "id", "email", "role" }`.

Use seeded users from `prisma/seed.ts` after `npm run db:seed`.

## Seeded demo users

See comments at the top of `prisma/seed.ts` (same values will be repeated in the root README in P4).

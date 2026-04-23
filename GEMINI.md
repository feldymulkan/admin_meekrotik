# Project Context: Mikhmon Admin

## Architecture Overview
This project is a full-stack application for managing Mikhmon system users. It consists of a Rust-based backend and a React-based frontend.

- **Backend**: Rust using [Axum](https://github.com/tokio-rs/axum) framework.
  - **Database Interaction**: [SeaORM](https://www.sea-ql.org/SeaORM/).
  - **Authentication**: JWT (JSON Web Token) dengan `bcrypt` for password hashing.
  - **Middleware**: Kustom JWT Auth middleware untuk proteksi route API.
  - **Port**: Default `8080` (configurable via `.env`).
- **Frontend**: React (TypeScript) using [Vite](https://vitejs.dev/).
  - **Styling**: Tailwind CSS.
  - **Icons**: Lucide React.
  - **State Management**: React Context API for Authentication.
  - **Port**: `8089`.

## Directory Structure
- `src/`: Rust backend source code.
  - `entities/`: SeaORM entity models for `admin_users` and `mikhmon_users`.
  - `routes/`: API endpoint handlers (auth, users).
  - `middleware/`: Kustom middleware (auth).
- `ui/`: React frontend source code.
  - `src/pages/`: Main application views (Login, Dashboard).
  - `src/AuthContext.tsx`: Authentication state provider.
  - `src/api.ts`: Axios configuration with interceptors for JWT.

## Database Strategy
The system connects to two distinct databases:
1. **Admin DB** (`DATABASE_URL`): Stores administrative user credentials for this API/UI.
2. **Mikhmon DB** (`MIKHMON_DATABASE_URL`): The target database being managed (Mikhmon-Fast users).

## Development Workflow
1. Start the backend: `cargo run`
2. Start the frontend: `cd ui && npm run dev`
3. Frontend proxies all `/api/*` requests to the backend.

## AI Instructions
- Maintain type safety across both Rust and TypeScript.
- Follow the existing pattern of using `Axum` states for database connections.
- When adding new frontend components, prioritize using Tailwind CSS for consistency with the existing modern UI.

# Project Context: Mikhmon Admin & Port Forwarding Manager

## Architecture Overview
This project is a full-stack application for managing Mikhmon system users and system-level port forwarding rules. It consists of a Rust-based backend and a React-based frontend.

- **Backend**: Rust using [Axum](https://github.com/tokio-rs/axum) framework.
  - **Database Interaction**: [SeaORM](https://www.sea-ql.org/SeaORM/) (migrating to support MySQL).
  - **Authentication**: JWT (JSON Web Token) with Argon2id for password hashing.
  - **Security**: Multi-Factor Authentication (MFA) via TOTP (Google Authenticator).
  - **System Integration**: Secure `iptables` management via `std::process::Command`.
  - **Middleware**: Custom JWT + MFA Auth middleware for API protection.
- **Frontend**: React (TypeScript) using [Vite](https://vitejs.dev/).
  - **Styling**: Tailwind CSS for a modern, responsive UI.
  - **State Management**: React Context API for Authentication & MFA status.

## Directory Structure
- `src/`: Rust backend source code.
  - `entities/`: SeaORM entity models (admin_users, mikhmon_users, port_rules, audit_logs).
  - `routes/`: API handlers (auth, users, port_rules, audit).
  - `middleware/`: Auth and logging middleware.
- `ui/`: React frontend source code.
  - `src/pages/`: Login, MFA Verify, Dashboard, Port Manager, Audit Logs.

## Database Strategy
The system manages three main data domains:
1. **Management DB** (`DATABASE_URL`): Stores admin users (with MFA secrets), port forwarding rules, and audit logs.
2. **Mikhmon DB** (`MIKHMON_DATABASE_URL`): The target database for managing Mikhmon-Fast users.

## Security Mandates
1. **No Shell Injection**: Use argument lists in `std::process::Command` for iptables.
2. **Least Privilege**: Run backend with limited sudo access for specific iptables commands.
3. **Auditability**: Every system change must be logged in `audit_logs`.
4. **MFA Enforced**: Critical actions and login require verified TOTP.

## Development Workflow
1. Start the backend: `cargo run`
2. Start the frontend: `cd ui && npm run dev`

## AI Instructions
- Maintain strict type safety in Rust and TypeScript.
- Use SeaORM for all database interactions.
- Ensure all port forwarding changes are wrapped in audit logging.
- Prioritize Tailwind CSS for all UI enhancements.

# Project Security Measures

This project implements several security measures to protect the administrative interface and the underlying data.

## Backend Security (Rust/Axum)

### 1. Authentication Middleware
All `/api/users` routes are protected by a JWT (JSON Web Token) authentication middleware. Requests must include a valid token in the `Authorization` header:
`Authorization: Bearer <JWT_TOKEN>`

### 2. Password Hashing
Administrative passwords are never stored in plain text. We use the `bcrypt` hashing algorithm with a standard cost factor to ensure password security even if the database is compromised.

### 3. Secure JWT Implementation
- Tokens are signed using a secret key (`JWT_SECRET`) defined in the environment.
- Tokens have a default expiration time of 24 hours.
- Claims include `sub` (username) and `exp` (expiration).

### 4. Input Validation & Sanitization
- Input fields like `username` and `password` are validated for presence and minimum length.
- Database error messages are masked from the user to prevent leakage of internal schema details.
- Unique identifiers (`unique_id`) are generated using `nanoid` to prevent ID enumeration attacks.

### 5. CORS (Cross-Origin Resource Sharing)
The backend is configured with a restrictive CORS policy that only allows requests from the specific frontend origin defined by `FRONTEND_URL` in the `.env` file.

## Frontend Security (React)

### 1. Route Guarding
The React application uses a context-based authentication system to protect the Dashboard and redirect unauthenticated users to the Login page.

### 2. Token Storage
JWT tokens are stored in `localStorage` and automatically attached to outgoing API requests via an Axios interceptor.

## Configuration Security

### Environment Variables
Sensitive configuration data is stored in a `.env` file, which is excluded from version control. This includes:
- Database credentials.
- JWT secret keys.
- Frontend origin URLs.

> [!IMPORTANT]
> **Production Recommendation**: For production deployments, always change the `JWT_SECRET` to a long, random string and ensure all database passwords are strong and unique.

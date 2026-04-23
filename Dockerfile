# Stage 1: Build
FROM rust:1.80-slim-bookworm as builder

WORKDIR /usr/src/app
COPY . .

# Install dependencies for building (if any)
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Build the application
RUN cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies (OpenSSL is needed for MySQL/JWT)
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /usr/src/app/target/release/admin /app/admin
COPY .env /app/.env

EXPOSE 8080

CMD ["./admin"]

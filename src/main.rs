use axum::{
    Router,
    routing::{get, patch, post, put},
};
use dotenvy::dotenv;
use sea_orm::{ConnectOptions, Database, DatabaseConnection};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod entities;
mod middleware;
mod routes;
use migration::MigratorTrait;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,         // Admin DB
    pub mikhmon_db: DatabaseConnection, // Mikhmon DB
    pub jwt_secret: String,
}

#[tokio::main]
async fn main() {
    // Load .env
    dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "admin=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Database connection with connection pool configuration
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let mut db_opts = ConnectOptions::new(db_url);
    db_opts.max_connections(50).min_connections(5);
    let db = Database::connect(db_opts)
        .await
        .expect("Failed to connect to admin database");

    let mikhmon_db_url =
        std::env::var("MIKHMON_DATABASE_URL").expect("MIKHMON_DATABASE_URL must be set");
    let mut mikhmon_db_opts = ConnectOptions::new(mikhmon_db_url);
    mikhmon_db_opts.max_connections(100).min_connections(5);
    let mikhmon_db = Database::connect(mikhmon_db_opts)
        .await
        .expect("Failed to connect to mikhmon database");

    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let state = AppState {
        db,
        mikhmon_db,
        jwt_secret,
    };

    // Run migrations and patches
    migration::Migrator::up(&state.db, None)
        .await
        .expect("Failed to run migrations for admin database");
    setup_mikhmon_database(&state.mikhmon_db).await;

    // CORS configuration
    let frontend_url =
        std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:8089".to_string());
    let cors = CorsLayer::new()
        .allow_origin(frontend_url.parse::<axum::http::HeaderValue>().unwrap())
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PUT,
            axum::http::Method::PATCH,
            axum::http::Method::DELETE,
        ])
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::CONTENT_TYPE,
        ]);

    // Build routes - Protected by JWT middleware
    let protected_routes = Router::new()
        // User management (Mikhmon)
        .route(
            "/api/users",
            get(routes::users::list_users).post(routes::users::create_user),
        )
        .route(
            "/api/users/:id",
            put(routes::users::update_user).delete(routes::users::delete_user),
        )
        .route("/api/users/:id/toggle", patch(routes::users::toggle_user))
        // Admin settings (Password & 2FA)
        .route(
            "/api/auth/reset-password",
            put(routes::auth::reset_password),
        )
        .route("/api/auth/2fa/setup", get(routes::auth::setup_2fa))
        .route("/api/auth/2fa/verify", post(routes::auth::verify_2fa))
        .route("/api/auth/2fa/disable", post(routes::auth::disable_2fa))
        .route("/api/auth/2fa/status", get(routes::auth::get_2fa_status))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            middleware::auth::auth_middleware,
        ));

    let app = Router::new()
        .route("/api/auth/login", post(routes::auth::login))
        .merge(protected_routes)
        .layer(cors)
        .with_state(state.clone());

    // Background task to automatically set expired users to inactive
    let bg_db = state.mikhmon_db.clone();
    tokio::spawn(async move {
        loop {
            tracing::info!("Running expiration check background task...");
            let query = "UPDATE users SET is_active = 0 WHERE expired_date IS NOT NULL AND expired_date != '' AND expired_date < CURDATE() AND is_active = 1";
            match sea_orm::ConnectionTrait::execute_unprepared(&bg_db, query).await {
                Ok(result) => tracing::info!(
                    "Expiration check completed. Rows affected: {}",
                    result.rows_affected()
                ),
                Err(e) => tracing::error!("Failed to execute expiration check: {}", e),
            }

            // Sleep for 24 hours (86400 seconds)
            tokio::time::sleep(std::time::Duration::from_secs(86400)).await;
        }
    });

    // Run server
    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr: SocketAddr = format!("{}:{}", host, port)
        .parse()
        .expect("Invalid address");

    tracing::info!("Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn setup_mikhmon_database(db: &sea_orm::DatabaseConnection) {
    tracing::info!("Checking and patching mikhmon database schema...");

    // Daftar kolom yang perlu dipastikan ada di tabel 'users' mikhmon
    let alter_queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_date VARCHAR(20) DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS expired_date VARCHAR(20) DEFAULT NULL",
    ];

    for query in alter_queries {
        match sea_orm::ConnectionTrait::execute_unprepared(db, query).await {
            Ok(_) => (),
            Err(e) => tracing::warn!(
                "Notice: Table patch step might have skipped (this is usually fine): {}",
                e
            ),
        }
    }
    tracing::info!("Mikhmon database schema check completed.");
}

use axum::{
    routing::{get, post, patch, put},
    Router,
};
use sea_orm::{Database, DatabaseConnection};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use dotenvy::dotenv;

mod entities;
mod routes;

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

    // Database connection
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db = Database::connect(db_url).await.expect("Failed to connect to admin database");

    let mikhmon_db_url = std::env::var("MIKHMON_DATABASE_URL").expect("MIKHMON_DATABASE_URL must be set");
    let mikhmon_db = Database::connect(mikhmon_db_url).await.expect("Failed to connect to mikhmon database");

    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let state = AppState { db, mikhmon_db, jwt_secret };

    // Build routes
    let app = Router::new()
        .route("/api/auth/login", post(routes::auth::login))
        .route("/api/users", get(routes::users::list_users).post(routes::users::create_user))
        .route(
            "/api/users/:id",
            put(routes::users::update_user)
                .delete(routes::users::delete_user),
        )
        .route("/api/users/:id/toggle", patch(routes::users::toggle_user))
        .layer(CorsLayer::permissive())
        .with_state(state);

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

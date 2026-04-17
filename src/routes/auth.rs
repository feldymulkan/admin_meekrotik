use axum::{
    extract::State,
    Json,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use crate::AppState;
use crate::entities::users::{Entity as User, Column};
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait};
use bcrypt::verify;
use hyper::StatusCode;

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub success: bool,
    pub message: String,
    pub token: Option<String>,
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    let user = User::find()
        .filter(Column::Username.eq(payload.username))
        .one(&state.db)
        .await;

    match user {
        Ok(Some(user)) => {
            if !user.is_active {
                return (StatusCode::FORBIDDEN, Json(LoginResponse {
                    success: false,
                    message: "User account is inactive".to_string(),
                    token: None,
                })).into_response();
            }

            if verify(payload.password, &user.password_hash).unwrap_or(false) {
                // In a real app, generate a JWT here
                (StatusCode::OK, Json(LoginResponse {
                    success: true,
                    message: "Login successful".to_string(),
                    token: Some("mock_jwt_token".to_string()),
                })).into_response()
            } else {
                (StatusCode::UNAUTHORIZED, Json(LoginResponse {
                    success: false,
                    message: "Invalid credentials".to_string(),
                    token: None,
                })).into_response()
            }
        }
        _ => (StatusCode::UNAUTHORIZED, Json(LoginResponse {
            success: false,
            message: "Invalid credentials".to_string(),
            token: None,
        })).into_response(),
    }
}

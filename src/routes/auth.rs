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
use axum::http::StatusCode;
use jsonwebtoken::{encode, Header, EncodingKey};

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

#[derive(Serialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
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
                // Generate real JWT token
                let expiration = chrono::Utc::now()
                    .checked_add_signed(chrono::Duration::hours(24))
                    .expect("valid timestamp")
                    .timestamp() as usize;

                let claims = Claims {
                    sub: user.username,
                    exp: expiration,
                };

                let token = encode(
                    &Header::default(),
                    &claims,
                    &EncodingKey::from_secret(state.jwt_secret.as_ref()),
                ).unwrap_or_else(|_| "token_error".to_string());

                (StatusCode::OK, Json(LoginResponse {
                    success: true,
                    message: "Login successful".to_string(),
                    token: Some(token),
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

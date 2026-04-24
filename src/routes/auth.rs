use axum::{
    extract::State,
    Json,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use crate::AppState;
use crate::entities::users::{Entity as AdminUser, Column, ActiveModel};
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, ActiveModelTrait, Set};
use bcrypt::{verify, hash, DEFAULT_COST};
use axum::http::StatusCode;
use jsonwebtoken::{encode, Header, EncodingKey};
use totp_rs::{Algorithm, TOTP, Secret};
use axum::Extension;

// ==================== Structs ====================

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
    pub totp_code: Option<String>,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub success: bool,
    pub message: String,
    pub token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub requires_2fa: Option<bool>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
}

#[derive(Deserialize)]
pub struct ResetPasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Deserialize)]
pub struct Verify2FARequest {
    pub totp_code: String,
}

#[derive(Deserialize)]
pub struct Disable2FARequest {
    pub password: String,
}

#[derive(Serialize)]
pub struct Setup2FAResponse {
    pub qr_code_base64: String,
    pub secret: String,
}

#[derive(Serialize)]
pub struct MessageResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Serialize)]
pub struct TwoFAStatusResponse {
    pub enabled: bool,
}

// ==================== Login ====================

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    let user = AdminUser::find()
        .filter(Column::Username.eq(&payload.username))
        .one(&state.db)
        .await;

    match user {
        Ok(Some(user)) => {
            if !verify(&payload.password, &user.password_hash).unwrap_or(false) {
                return (StatusCode::UNAUTHORIZED, Json(LoginResponse {
                    success: false,
                    message: "Invalid credentials".to_string(),
                    token: None,
                    requires_2fa: None,
                })).into_response();
            }

            // Check if 2FA is enabled
            if let Some(ref totp_secret) = user.totp_secret {
                // 2FA is enabled; we need the code
                match &payload.totp_code {
                    Some(code) => {
                        let totp = match TOTP::new(
                            Algorithm::SHA1,
                            6,
                            1,
                            30,
                            Secret::Encoded(totp_secret.clone()).to_bytes().unwrap_or_default(),
                            Some("Mikhmon Admin".to_string()),
                            user.username.clone(),
                        ) {
                            Ok(t) => t,
                            Err(_) => {
                                return (StatusCode::INTERNAL_SERVER_ERROR, Json(LoginResponse {
                                    success: false,
                                    message: "2FA configuration error".to_string(),
                                    token: None,
                                    requires_2fa: None,
                                })).into_response();
                            }
                        };

                        if !totp.check_current(code).unwrap_or(false) {
                            return (StatusCode::UNAUTHORIZED, Json(LoginResponse {
                                success: false,
                                message: "Invalid 2FA code".to_string(),
                                token: None,
                                requires_2fa: Some(true),
                            })).into_response();
                        }
                    }
                    None => {
                        // Password correct but 2FA code not provided
                        return (StatusCode::OK, Json(LoginResponse {
                            success: false,
                            message: "2FA code required".to_string(),
                            token: None,
                            requires_2fa: Some(true),
                        })).into_response();
                    }
                }
            }

            // Generate JWT token
            let expiration = chrono::Utc::now()
                .checked_add_signed(chrono::Duration::hours(24))
                .expect("valid timestamp")
                .timestamp() as usize;

            let claims = Claims {
                sub: user.username,
                exp: expiration,
            };

            match encode(&Header::default(), &claims, &EncodingKey::from_secret(state.jwt_secret.as_ref())) {
                Ok(token) => {
                    (StatusCode::OK, Json(LoginResponse {
                        success: true,
                        message: "Login successful".to_string(),
                        token: Some(token),
                        requires_2fa: None,
                    })).into_response()
                }
                Err(_) => {
                    (StatusCode::INTERNAL_SERVER_ERROR, Json(LoginResponse {
                        success: false,
                        message: "Failed to generate token".to_string(),
                        token: None,
                        requires_2fa: None,
                    })).into_response()
                }
            }
        }
        _ => (StatusCode::UNAUTHORIZED, Json(LoginResponse {
            success: false,
            message: "Invalid credentials".to_string(),
            token: None,
            requires_2fa: None,
        })).into_response(),
    }
}

// ==================== Reset Password ====================

pub async fn reset_password(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ResetPasswordRequest>,
) -> impl IntoResponse {
    if payload.new_password.len() < 6 {
        return (StatusCode::BAD_REQUEST, Json(MessageResponse {
            success: false,
            message: "New password must be at least 6 characters".to_string(),
        })).into_response();
    }

    let user = AdminUser::find()
        .filter(Column::Username.eq(&claims.sub))
        .one(&state.db)
        .await;

    match user {
        Ok(Some(user)) => {
            if !verify(&payload.current_password, &user.password_hash).unwrap_or(false) {
                return (StatusCode::UNAUTHORIZED, Json(MessageResponse {
                    success: false,
                    message: "Current password is incorrect".to_string(),
                })).into_response();
            }

            let new_hash = match hash(&payload.new_password, DEFAULT_COST) {
                Ok(h) => h,
                Err(_) => {
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(MessageResponse {
                        success: false,
                        message: "Failed to hash password".to_string(),
                    })).into_response();
                }
            };

            let mut active: ActiveModel = user.into();
            active.password_hash = Set(new_hash);

            match active.update(&state.db).await {
                Ok(_) => (StatusCode::OK, Json(MessageResponse {
                    success: true,
                    message: "Password updated successfully".to_string(),
                })).into_response(),
                Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(MessageResponse {
                    success: false,
                    message: "Failed to update password".to_string(),
                })).into_response(),
            }
        }
        _ => (StatusCode::NOT_FOUND, Json(MessageResponse {
            success: false,
            message: "User not found".to_string(),
        })).into_response(),
    }
}

// ==================== Setup 2FA ====================

pub async fn setup_2fa(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    let secret = Secret::generate_secret();
    let secret_base32 = secret.to_encoded().to_string();

    let totp = match TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret.to_bytes().unwrap_or_default(),
        Some("Mikhmon Admin".to_string()),
        claims.sub.clone(),
    ) {
        Ok(t) => t,
        Err(_) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(MessageResponse {
                success: false,
                message: "Failed to generate TOTP".to_string()
            })).into_response();
        }
    };

    let qr_code = match totp.get_qr_base64() {
        Ok(qr) => qr,
        Err(_) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(MessageResponse {
                success: false,
                message: "Failed to generate QR code".to_string()
            })).into_response();
        }
    };

    // Store the secret temporarily — it will be confirmed in verify_2fa
    let user = AdminUser::find()
        .filter(Column::Username.eq(&claims.sub))
        .one(&state.db)
        .await;

    match user {
        Ok(Some(user)) => {
            let mut active: ActiveModel = user.into();
            active.totp_secret = Set(Some(format!("pending:{}", secret_base32)));

            if active.update(&state.db).await.is_err() {
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(MessageResponse {
                    success: false,
                    message: "Failed to save 2FA setup".to_string()
                })).into_response();
            }

            Json(Setup2FAResponse {
                qr_code_base64: qr_code,
                secret: secret_base32
            }).into_response()
        }
        _ => (StatusCode::NOT_FOUND, Json(MessageResponse {
            success: false,
            message: "User not found".to_string()
        })).into_response(),
    }
}

// ==================== Verify 2FA (Activation) ====================

pub async fn verify_2fa(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<Verify2FARequest>,
) -> impl IntoResponse {
    let user = AdminUser::find()
        .filter(Column::Username.eq(&claims.sub))
        .one(&state.db)
        .await;

    match user {
        Ok(Some(user)) => {
            let totp_secret = match &user.totp_secret {
                Some(s) if s.starts_with("pending:") => s.strip_prefix("pending:").unwrap().to_string(),
                _ => {
                    return (StatusCode::BAD_REQUEST, Json(MessageResponse {
                        success: false,
                        message: "No pending 2FA setup found. Please setup 2FA first.".to_string(),
                    })).into_response();
                }
            };

            let totp = match TOTP::new(
                Algorithm::SHA1,
                6,
                1,
                30,
                Secret::Encoded(totp_secret.clone()).to_bytes().unwrap_or_default(),
                Some("Mikhmon Admin".to_string()),
                claims.sub.clone(),
            ) {
                Ok(t) => t,
                Err(_) => {
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(MessageResponse {
                        success: false,
                        message: "2FA configuration error".to_string(),
                    })).into_response();
                }
            };

            if !totp.check_current(&payload.totp_code).unwrap_or(false) {
                return (StatusCode::BAD_REQUEST, Json(MessageResponse {
                    success: false,
                    message: "Invalid verification code. Please try again.".to_string(),
                })).into_response();
            }

            // Verification successful, activate 2FA
            let mut active: ActiveModel = user.into();
            active.totp_secret = Set(Some(totp_secret));

            match active.update(&state.db).await {
                Ok(_) => (StatusCode::OK, Json(MessageResponse {
                    success: true,
                    message: "2FA has been activated successfully!".to_string(),
                })).into_response(),
                Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(MessageResponse {
                    success: false,
                    message: "Failed to activate 2FA".to_string(),
                })).into_response(),
            }
        }
        _ => (StatusCode::NOT_FOUND, Json(MessageResponse {
            success: false,
            message: "User not found".to_string(),
        })).into_response(),
    }
}

// ==================== Disable 2FA ====================

pub async fn disable_2fa(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<Disable2FARequest>,
) -> impl IntoResponse {
    let user = AdminUser::find()
        .filter(Column::Username.eq(&claims.sub))
        .one(&state.db)
        .await;

    match user {
        Ok(Some(user)) => {
            if !verify(&payload.password, &user.password_hash).unwrap_or(false) {
                return (StatusCode::UNAUTHORIZED, Json(MessageResponse {
                    success: false,
                    message: "Incorrect password".to_string(),
                })).into_response();
            }

            let mut active: ActiveModel = user.into();
            active.totp_secret = Set(None);

            match active.update(&state.db).await {
                Ok(_) => (StatusCode::OK, Json(MessageResponse {
                    success: true,
                    message: "2FA has been disabled".to_string(),
                })).into_response(),
                Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(MessageResponse {
                    success: false,
                    message: "Failed to disable 2FA".to_string(),
                })).into_response(),
            }
        }
        _ => (StatusCode::NOT_FOUND, Json(MessageResponse {
            success: false,
            message: "User not found".to_string(),
        })).into_response(),
    }
}

// ==================== 2FA Status ====================

pub async fn get_2fa_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    let user = AdminUser::find()
        .filter(Column::Username.eq(&claims.sub))
        .one(&state.db)
        .await;

    match user {
        Ok(Some(user)) => {
            let enabled = user.totp_secret.as_ref().map_or(false, |s| !s.starts_with("pending:"));
            Json(TwoFAStatusResponse { enabled }).into_response()
        }
        _ => (StatusCode::NOT_FOUND, Json(MessageResponse {
            success: false,
            message: "User not found".to_string(),
        })).into_response(),
    }
}

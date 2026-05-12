use axum::{
    body::Body,
    extract::State,
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use crate::AppState;
use crate::routes::auth::Claims;

pub async fn auth_middleware(
    State(state): State<AppState>,
    req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req
        .headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let auth_header = match auth_header {
        Some(header) => header,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..];

    match decode::<Claims>(
        token,
        &DecodingKey::from_secret(state.jwt_secret.as_ref()),
        &Validation::default(),
    ) {
        Ok(token_data) => {
            // If MFA is pending, only allow access to the MFA verification route
            if token_data.claims.mfa_pending && req.uri().path() != "/api/auth/mfa/verify" {
                tracing::warn!("MFA pending for user {}, access to {} denied", token_data.claims.sub, req.uri().path());
                return Err(StatusCode::UNAUTHORIZED);
            }

            let mut req = req;
            req.extensions_mut().insert(token_data.claims);
            Ok(next.run(req).await)
        }
        Err(e) => {
            tracing::error!("JWT decoding failed: {}", e);
            Err(StatusCode::UNAUTHORIZED)
        }
    }
}

use axum::{
    extract::{Path, State},
    Json,
    response::IntoResponse,
};
use sea_orm::*;
use serde::{Deserialize, Serialize};
use crate::AppState;
use crate::entities::users::{Entity as User, ActiveModel, Model};
use bcrypt::{hash, DEFAULT_COST};
use hyper::StatusCode;

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: i32,
    pub username: String,
    pub is_active: bool,
}

pub async fn list_users(State(state): State<AppState>) -> impl IntoResponse {
    let users = User::find().all(&state.db).await;

    match users {
        Ok(users) => {
            let resp: Vec<UserResponse> = users
                .into_iter()
                .map(|u| UserResponse {
                    id: u.id,
                    username: u.username,
                    is_active: u.is_active,
                })
                .collect();
            Json(resp).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> impl IntoResponse {
    let password_hash = hash(payload.password, DEFAULT_COST).unwrap();

    let new_user = ActiveModel {
        username: Set(payload.username),
        password_hash: Set(password_hash),
        is_active: Set(true),
        created_at: Set(chrono::Utc::now()),
        ..Default::default()
    };

    match new_user.insert(&state.db).await {
        Ok(user) => (StatusCode::CREATED, Json(UserResponse {
            id: user.id,
            username: user.username,
            is_active: user.is_active,
        })).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn update_user(
    Path(id): Path<i32>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateUserRequest>,
) -> impl IntoResponse {
    let user = User::find_by_id(id).one(&state.db).await;

    match user {
        Ok(Some(user)) => {
            let mut user: ActiveModel = user.into();
            
            if let Some(username) = payload.username {
                user.username = Set(username);
            }
            
            if let Some(password) = payload.password {
                let password_hash = hash(password, DEFAULT_COST).unwrap();
                user.password_hash = Set(password_hash);
            }

            match user.update(&state.db).await {
                Ok(user) => Json(UserResponse {
                    id: user.id,
                    username: user.username,
                    is_active: user.is_active,
                }).into_response(),
                Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
            }
        }
        _ => (StatusCode::NOT_FOUND, "User not found").into_response(),
    }
}

pub async fn delete_user(
    Path(id): Path<i32>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    match User::delete_by_id(id).exec(&state.db).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn toggle_user(
    Path(id): Path<i32>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let user = User::find_by_id(id).one(&state.db).await;

    match user {
        Ok(Some(user)) => {
            let is_active = !user.is_active;
            let mut user: ActiveModel = user.into();
            user.is_active = Set(is_active);

            match user.update(&state.db).await {
                Ok(user) => Json(UserResponse {
                    id: user.id,
                    username: user.username,
                    is_active: user.is_active,
                }).into_response(),
                Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
            }
        }
        _ => (StatusCode::NOT_FOUND, "User not found").into_response(),
    }
}

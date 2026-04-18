use axum::{
    extract::{Path, State},
    Json,
    response::IntoResponse,
};
use sea_orm::*;
use serde::{Deserialize, Serialize};
use crate::AppState;
use crate::entities::mikhmon_users::{Entity as User, ActiveModel, Column};
use bcrypt::{hash, DEFAULT_COST};
use axum::http::StatusCode;
use nanoid::nanoid;

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
    pub unique_id: Option<String>,
    pub theme: Option<String>,
    pub themecolor: Option<String>,
    pub lang: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub password: Option<String>,
    pub unique_id: Option<String>,
    pub is_active: Option<bool>,
    pub theme: Option<String>,
    pub themecolor: Option<String>,
    pub lang: Option<String>,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: i32,
    pub unique_id: String,
    pub username: String,
    pub is_active: bool,
    pub theme: Option<String>,
    pub themecolor: Option<String>,
    pub lang: Option<String>,
}

pub async fn list_users(State(state): State<AppState>) -> impl IntoResponse {
    let users = User::find().all(&state.mikhmon_db).await;

    match users {
        Ok(users) => {
            let resp: Vec<UserResponse> = users
                .into_iter()
                .map(|u| UserResponse {
                    id: u.id,
                    unique_id: u.unique_id,
                    username: u.username,
                    is_active: u.is_active,
                    theme: u.theme,
                    themecolor: u.themecolor,
                    lang: u.lang,
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
    
    // Generate random unique_id if not provided
    let unique_id = payload.unique_id.unwrap_or_else(|| nanoid!(10));

    let new_user = ActiveModel {
        username: Set(payload.username),
        password: Set(password_hash),
        unique_id: Set(unique_id),
        is_active: Set(true),
        theme: Set(payload.theme.or(Some("light".to_string()))),
        themecolor: Set(payload.themecolor.or(Some("#3a4149".to_string()))),
        lang: Set(payload.lang.or(Some("id".to_string()))),
        ..Default::default()
    };

    match new_user.insert(&state.mikhmon_db).await {
        Ok(user) => (StatusCode::CREATED, Json(UserResponse {
            id: user.id,
            unique_id: user.unique_id,
            username: user.username,
            is_active: user.is_active,
            theme: user.theme,
            themecolor: user.themecolor,
            lang: user.lang,
        })).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn update_user(
    Path(uid): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateUserRequest>,
) -> impl IntoResponse {
    let user = User::find()
        .filter(Column::UniqueId.eq(uid))
        .one(&state.mikhmon_db)
        .await;

    match user {
        Ok(Some(user)) => {
            let mut user: ActiveModel = user.into();
            
            if let Some(username) = payload.username {
                user.username = Set(username);
            }
            
            if let Some(password) = payload.password {
                let password_hash = hash(password, DEFAULT_COST).unwrap();
                user.password = Set(password_hash);
            }

            if let Some(unique_id) = payload.unique_id {
                user.unique_id = Set(unique_id);
            }

            if let Some(is_active) = payload.is_active {
                user.is_active = Set(is_active);
            }

            if let Some(theme) = payload.theme {
                user.theme = Set(Some(theme));
            }

            if let Some(themecolor) = payload.themecolor {
                user.themecolor = Set(Some(themecolor));
            }

            if let Some(lang) = payload.lang {
                user.lang = Set(Some(lang));
            }

            match user.update(&state.mikhmon_db).await {
                Ok(user) => Json(UserResponse {
                    id: user.id,
                    unique_id: user.unique_id,
                    username: user.username,
                    is_active: user.is_active,
                    theme: user.theme,
                    themecolor: user.themecolor,
                    lang: user.lang,
                }).into_response(),
                Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
            }
        }
        _ => (StatusCode::NOT_FOUND, "User not found").into_response(),
    }
}

pub async fn delete_user(
    Path(uid): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    match User::delete_many()
        .filter(Column::UniqueId.eq(uid))
        .exec(&state.mikhmon_db)
        .await 
    {
        Ok(res) => {
            if res.rows_affected > 0 {
                StatusCode::NO_CONTENT.into_response()
            } else {
                (StatusCode::NOT_FOUND, "User not found").into_response()
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn toggle_user(
    Path(uid): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let user = User::find()
        .filter(Column::UniqueId.eq(uid))
        .one(&state.mikhmon_db)
        .await;

    match user {
        Ok(Some(user)) => {
            let is_active = !user.is_active;
            let mut user: ActiveModel = user.into();
            user.is_active = Set(is_active);

            match user.update(&state.mikhmon_db).await {
                Ok(user) => Json(UserResponse {
                    id: user.id,
                    unique_id: user.unique_id,
                    username: user.username,
                    is_active: user.is_active,
                    theme: user.theme,
                    themecolor: user.themecolor,
                    lang: user.lang,
                }).into_response(),
                Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
            }
        }
        _ => (StatusCode::NOT_FOUND, "User not found").into_response(),
    }
}

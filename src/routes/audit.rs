use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use crate::AppState;
use crate::entities::audit_logs;
use sea_orm::{EntityTrait, QueryOrder, QuerySelect};

pub async fn list_audit_logs(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let logs = audit_logs::Entity::find()
        .order_by_desc(audit_logs::Column::CreatedAt)
        .limit(100)
        .all(&state.db)
        .await;

    match logs {
        Ok(logs) => Json(logs).into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Extension, Json,
};
use serde::Deserialize;
use crate::AppState;
use crate::entities::{port_rules, audit_logs, users};
use crate::routes::auth::Claims;
use crate::system::iptables::{self, IptablesRule};
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, ActiveModelTrait, Set};

#[derive(Deserialize)]
pub struct CreateRuleRequest {
    pub description: String,
    pub protocol: String,
    pub external_port: i32,
    pub internal_ip: String,
    pub internal_port: i32,
}

pub async fn list_rules(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let rules = port_rules::Entity::find()
        .all(&state.db)
        .await;

    match rules {
        Ok(rules) => Json(rules).into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

pub async fn create_rule(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateRuleRequest>,
) -> impl IntoResponse {
    // 1. Find user ID
    let user = users::Entity::find()
        .filter(users::Column::Username.eq(&claims.sub))
        .one(&state.db)
        .await;

    let user_id = match user {
        Ok(Some(u)) => u.id,
        _ => return StatusCode::UNAUTHORIZED.into_response(),
    };

    // 2. Add to iptables
    let iptables_rule = IptablesRule {
        protocol: payload.protocol.clone(),
        external_port: payload.external_port,
        internal_ip: payload.internal_ip.clone(),
        internal_port: payload.internal_port,
    };

    if let Err(e) = iptables::add_port_forward(&iptables_rule) {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e }))).into_response();
    }

    // 3. Save to DB
    let new_rule = port_rules::ActiveModel {
        description: Set(payload.description.clone()),
        protocol: Set(payload.protocol),
        external_port: Set(payload.external_port),
        internal_ip: Set(payload.internal_ip),
        internal_port: Set(payload.internal_port),
        created_by: Set(user_id),
        ..Default::default()
    };

    let result = new_rule.insert(&state.db).await;

    match result {
        Ok(rule) => {
            // 4. Log audit
            let audit = audit_logs::ActiveModel {
                user_id: Set(user_id),
                action: Set("ADD_RULE".to_string()),
                details: Set(format!("Added port rule: {} -> {}:{}", rule.external_port, rule.internal_ip, rule.internal_port)),
                ip_address: Set("unknown".to_string()), // Simplified
                ..Default::default()
            };
            let _ = audit.insert(&state.db).await;

            (StatusCode::CREATED, Json(rule)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

pub async fn delete_rule(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    // 1. Find rule
    let rule = port_rules::Entity::find_by_id(id).one(&state.db).await;

    match rule {
        Ok(Some(rule)) => {
            // 2. Remove from iptables
            let iptables_rule = IptablesRule {
                protocol: rule.protocol.clone(),
                external_port: rule.external_port,
                internal_ip: rule.internal_ip.clone(),
                internal_port: rule.internal_port,
            };

            if let Err(e) = iptables::remove_port_forward(&iptables_rule) {
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e }))).into_response();
            }

            // 3. Delete from DB
            let _ = port_rules::Entity::delete_by_id(id).exec(&state.db).await;

            // 4. Log audit
            let user = users::Entity::find()
                .filter(users::Column::Username.eq(&claims.sub))
                .one(&state.db)
                .await;

            if let Ok(Some(u)) = user {
                let audit = audit_logs::ActiveModel {
                    user_id: Set(u.id),
                    action: Set("DELETE_RULE".to_string()),
                    details: Set(format!("Deleted port rule: {} -> {}:{}", rule.external_port, rule.internal_ip, rule.internal_port)),
                    ip_address: Set("unknown".to_string()),
                    ..Default::default()
                };
                let _ = audit.insert(&state.db).await;
            }

            StatusCode::NO_CONTENT.into_response()
        }
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

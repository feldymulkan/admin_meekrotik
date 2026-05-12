use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Alter admin_users table to add mfa_enabled
        manager
            .alter_table(
                Table::alter()
                    .table(AdminUsers::Table)
                    .add_column(boolean(AdminUsers::MfaEnabled).default(false))
                    .to_owned(),
            )
            .await?;

        // Create port_rules table
        manager
            .create_table(
                Table::create()
                    .table(PortRules::Table)
                    .if_not_exists()
                    .col(pk_auto(PortRules::Id))
                    .col(string(PortRules::Description))
                    .col(string(PortRules::Protocol)) // Use string for enum-like behavior
                    .col(integer(PortRules::ExternalPort))
                    .col(string(PortRules::InternalIp))
                    .col(integer(PortRules::InternalPort))
                    .col(integer(PortRules::CreatedBy))
                    .col(timestamp(PortRules::CreatedAt).default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-port_rules-admin_users")
                            .from(PortRules::Table, PortRules::CreatedBy)
                            .to(AdminUsers::Table, AdminUsers::Id)
                    )
                    .to_owned(),
            )
            .await?;

        // Create audit_logs table
        manager
            .create_table(
                Table::create()
                    .table(AuditLogs::Table)
                    .if_not_exists()
                    .col(pk_auto(AuditLogs::Id))
                    .col(integer(AuditLogs::UserId))
                    .col(string(AuditLogs::Action))
                    .col(text(AuditLogs::Details))
                    .col(string(AuditLogs::IpAddress))
                    .col(timestamp(AuditLogs::CreatedAt).default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-audit_logs-admin_users")
                            .from(AuditLogs::Table, AuditLogs::UserId)
                            .to(AdminUsers::Table, AdminUsers::Id)
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(AuditLogs::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(PortRules::Table).to_owned())
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(AdminUsers::Table)
                    .drop_column(AdminUsers::MfaEnabled)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum AdminUsers {
    Table,
    Id,
    MfaEnabled,
}

#[derive(DeriveIden)]
enum PortRules {
    Table,
    Id,
    Description,
    Protocol,
    ExternalPort,
    InternalIp,
    InternalPort,
    CreatedBy,
    CreatedAt,
}

#[derive(DeriveIden)]
enum AuditLogs {
    Table,
    Id,
    UserId,
    Action,
    Details,
    IpAddress,
    CreatedAt,
}

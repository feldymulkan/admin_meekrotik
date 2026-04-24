use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(AdminUsers::Table)
                    .if_not_exists()
                    .col(pk_auto(AdminUsers::Id))
                    .col(string(AdminUsers::Username).unique_key())
                    .col(string(AdminUsers::PasswordHash))
                    .col(string_null(AdminUsers::TotpSecret))
                    .col(timestamp(AdminUsers::CreatedAt).default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(AdminUsers::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum AdminUsers {
    Table,
    Id,
    Username,
    PasswordHash,
    TotpSecret,
    CreatedAt,
}

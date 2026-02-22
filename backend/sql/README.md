# Database Migrations

## Phase 1 Schema Upgrade

Run `V1__phase1_schema_upgrade.sql` against your MySQL database when upgrading to the Phase 1 schema.

**Note:** With `spring.jpa.hibernate.ddl-auto: update`, JPA will automatically add new columns and create the feature tables when the application starts. Use this SQL script only if:
- You run migrations manually before deploying the app
- You need to apply changes without restarting the application

**Run once.** Re-running may fail with "Duplicate column" errors if columns already exist. For existing databases, run sections selectively or use a migration tool (Flyway/Liquibase) that tracks executed scripts.

```bash
mysql -u root -p medibot < V1__phase1_schema_upgrade.sql
```

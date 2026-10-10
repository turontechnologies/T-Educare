-- Adds a View/Edit distinction on top of Role's existing plain menu
-- visibility: editable_menu_keys is always a subset of menu_keys (enforced
-- in RoleService, not the DB, same convention as every other cross-field
-- rule in this codebase). NULL/blank means "view-only everywhere this role
-- grants visibility" — a safe, explicit-opt-in-to-edit default.
ALTER TABLE dbo.roles ADD editable_menu_keys NVARCHAR(1000) NULL;

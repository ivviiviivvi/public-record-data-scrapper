## 2024-05-23 - SQL Injection Protection in Dynamic Queries
**Vulnerability:** The `bulkInsert` method allowed SQL injection via `table` and `columns` arguments because they were directly interpolated into the query string without validation.
**Learning:** Even internal helper methods should validate inputs that control SQL structure (identifiers), as they might be exposed to user input later or misused by other developers.
**Prevention:** Implement strict regex validation (`/^[a-zA-Z0-9_]+$/`) for any dynamic SQL identifiers (tables, columns) to ensure they only contain safe characters.

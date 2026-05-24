import Database from "better-sqlite3"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/**
 * Create an in-memory SQLite database with all tables defined by the schema.
 * Returns the raw better-sqlite3 Database instance.
 */
export function createTestDb(): Database {
  const tmpDir = mkdtempSync(join(tmpdir(), "ronzz-test-"))
  const db = new Database(":memory:")

  db.exec(`
    CREATE TABLE "user" (
      "id" text PRIMARY KEY NOT NULL,
      "email" text NOT NULL UNIQUE,
      "password_hash" text NOT NULL,
      "role" text NOT NULL DEFAULT 'editor',
      "password_change_required" integer NOT NULL DEFAULT 0,
      "created_at" text NOT NULL
    );

    CREATE TABLE "session" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id"),
      "expires_at" integer NOT NULL
    );

    CREATE TABLE "resource_type" (
      "id" text PRIMARY KEY NOT NULL,
      "slug" text NOT NULL UNIQUE,
      "name_fr" text NOT NULL,
      "name_eo" text NOT NULL,
      "name_en" text NOT NULL
    );

    CREATE TABLE "resource" (
      "id" text PRIMARY KEY NOT NULL,
      "type_id" text NOT NULL REFERENCES "resource_type"("id"),
      "title" text NOT NULL,
      "description" text NOT NULL DEFAULT '',
      "url" text NOT NULL,
      "locale" text NOT NULL DEFAULT 'fr',
      "metadata" text DEFAULT '{}',
      "created_at" text NOT NULL,
      "updated_at" text NOT NULL,
      "deleted_at" text
    );

    CREATE TABLE "dataset" (
      "id" text PRIMARY KEY NOT NULL,
      "title" text NOT NULL,
      "description" text NOT NULL DEFAULT '',
      "source" text NOT NULL DEFAULT '',
      "source_url" text NOT NULL DEFAULT '',
      "license" text NOT NULL DEFAULT '',
      "locale" text NOT NULL DEFAULT 'fr',
      "chart_type" text NOT NULL DEFAULT 'bar',
      "metadata" text DEFAULT '{}',
      "created_at" text NOT NULL,
      "updated_at" text NOT NULL,
      "deleted_at" text
    );

    CREATE TABLE "datapoint" (
      "id" text PRIMARY KEY NOT NULL,
      "dataset_id" text NOT NULL REFERENCES "dataset"("id"),
      "dimension_key" text NOT NULL DEFAULT '',
      "dimension_value" text NOT NULL DEFAULT '',
      "value" real NOT NULL DEFAULT 0,
      "unit" text NOT NULL DEFAULT '',
      "year" text NOT NULL DEFAULT '',
      "metadata" text DEFAULT '{}',
      "created_at" text NOT NULL
    );

    CREATE TABLE "article_metadata" (
      "id" text PRIMARY KEY NOT NULL,
      "slug" text NOT NULL UNIQUE,
      "title" text NOT NULL,
      "description" text NOT NULL DEFAULT '',
      "locale" text NOT NULL DEFAULT 'fr',
      "metadata" text DEFAULT '{}',
      "published_at" text,
      "created_at" text NOT NULL,
      "updated_at" text NOT NULL,
      "deleted_at" text
    );

    CREATE TABLE "search_index" (
      "id" text PRIMARY KEY NOT NULL,
      "type" text NOT NULL,
      "locale" text NOT NULL,
      "title" text NOT NULL,
      "description" text NOT NULL DEFAULT '',
      "content" text NOT NULL DEFAULT '',
      "url" text NOT NULL,
      "score" real NOT NULL DEFAULT 0,
      "created_at" text NOT NULL,
      "updated_at" text NOT NULL
    );

    CREATE TABLE "api_token" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id"),
      "name" text NOT NULL,
      "token_hash" text NOT NULL,
      "prefix" text NOT NULL,
      "revoked_at" text,
      "created_at" text NOT NULL,
      "last_used_at" text
    );
  `)

  // Enable WAL for better test performance
  db.pragma("journal_mode = WAL")

  return db
}

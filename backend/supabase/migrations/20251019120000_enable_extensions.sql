-- migration: enable required postgresql extensions
-- description: enables uuid-ossp for uuid generation and unaccent for full-text search
-- tables affected: none (extensions only)
-- author: github copilot
-- date: 2025-10-19

-- enable uuid generation extension
-- this is required for generating uuid_generate_v4() values for primary keys
create extension if not exists "uuid-ossp";

-- enable unaccent extension for full-text search with polish language support
-- this will be used for future full-text search features
create extension if not exists "unaccent";

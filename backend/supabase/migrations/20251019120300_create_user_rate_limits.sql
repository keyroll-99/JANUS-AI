-- migration: create user_rate_limits table
-- description: creates table for tracking ai analysis usage limits per user
-- tables affected: user_rate_limits
-- author: github copilot
-- date: 2025-10-19
-- note: one user has one rate limit record (enforced by unique constraint on user_id)

-- create user_rate_limits table
-- tracks daily, monthly, and total ai analysis counts for rate limiting
-- one-to-one relationship with auth.users
create table if not exists user_rate_limits (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    daily_analyses_count integer not null default 0 check (daily_analyses_count >= 0),
    daily_limit integer not null default 3 check (daily_limit > 0),
    last_analysis_date date null,
    monthly_analyses_count integer not null default 0 check (monthly_analyses_count >= 0),
    total_analyses_count integer not null default 0 check (total_analyses_count >= 0),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- enable row level security
-- ensures users can only view their own rate limit information
alter table user_rate_limits enable row level security;

-- policy: authenticated users can select only their own rate limits
-- validates that the user_id matches the authenticated user's id
create policy rate_limits_select_policy on user_rate_limits
    for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: authenticated users can insert only their own rate limits
-- typically used when a user first triggers an ai analysis
create policy rate_limits_insert_policy on user_rate_limits
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: authenticated users can update only their own rate limits
-- used when incrementing analysis counters
create policy rate_limits_update_policy on user_rate_limits
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- create indexes for performance
-- unique index on user_id for fast lookups and enforcing one record per user
create unique index if not exists idx_user_rate_limits_user_id on user_rate_limits(user_id);

-- index for finding users whose daily limit needs reset
create index if not exists idx_user_rate_limits_last_analysis_date on user_rate_limits(last_analysis_date);

-- add comments to table and columns for documentation
comment on table user_rate_limits is 'Tracks AI analysis usage limits and counters for each user';
comment on column user_rate_limits.id is 'Primary key - unique identifier';
comment on column user_rate_limits.user_id is 'Foreign key to auth.users - owner of these limits (unique)';
comment on column user_rate_limits.daily_analyses_count is 'Number of analyses performed today (resets daily)';
comment on column user_rate_limits.daily_limit is 'Maximum number of analyses allowed per day (default: 3)';
comment on column user_rate_limits.last_analysis_date is 'Date of the last analysis (used for daily reset logic)';
comment on column user_rate_limits.monthly_analyses_count is 'Number of analyses performed this month';
comment on column user_rate_limits.total_analyses_count is 'Total number of analyses performed all time';
comment on column user_rate_limits.created_at is 'Timestamp when record was created';
comment on column user_rate_limits.updated_at is 'Timestamp of last update (auto-updated by trigger)';

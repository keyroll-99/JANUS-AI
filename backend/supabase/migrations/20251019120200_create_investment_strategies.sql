-- migration: create investment_strategies table
-- description: creates table for storing user investment strategies
-- tables affected: investment_strategies
-- author: github copilot
-- date: 2025-10-19
-- note: one user can have only one investment strategy (enforced by unique constraint on user_id)

-- create investment_strategies table
-- stores the investment strategy for each user including time horizon, risk level, and goals
-- one-to-one relationship with auth.users (one user = one strategy)
create table if not exists investment_strategies (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    time_horizon varchar(20) not null check (time_horizon in ('SHORT', 'MEDIUM', 'LONG')),
    risk_level varchar(20) not null check (risk_level in ('LOW', 'MEDIUM', 'HIGH')),
    investment_goals text not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- enable row level security
-- ensures users can only access their own investment strategy
alter table investment_strategies enable row level security;

-- policy: authenticated users can select only their own strategy
-- validates that the user_id matches the authenticated user's id
create policy strategies_select_policy on investment_strategies
    for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: authenticated users can insert only their own strategy
-- validates that the user_id in the new row matches the authenticated user's id
create policy strategies_insert_policy on investment_strategies
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: authenticated users can update only their own strategy
-- validates both the existing and new user_id match the authenticated user
create policy strategies_update_policy on investment_strategies
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: authenticated users can delete only their own strategy
-- validates that the user_id matches the authenticated user's id
create policy strategies_delete_policy on investment_strategies
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- create indexes for performance
-- primary index on user_id for fast lookups (also enforces unique constraint)
create unique index if not exists idx_investment_strategies_user_id on investment_strategies(user_id);

-- add comments to table and columns for documentation
comment on table investment_strategies is 'Stores investment strategy for each user (one-to-one relationship)';
comment on column investment_strategies.id is 'Primary key - unique identifier for strategy';
comment on column investment_strategies.user_id is 'Foreign key to auth.users - owner of this strategy (unique)';
comment on column investment_strategies.time_horizon is 'Investment time horizon: SHORT (0-2 years), MEDIUM (2-5 years), LONG (5+ years)';
comment on column investment_strategies.risk_level is 'Acceptable risk level: LOW, MEDIUM, HIGH';
comment on column investment_strategies.investment_goals is 'Descriptive text explaining user investment goals';
comment on column investment_strategies.created_at is 'Timestamp when strategy was created';
comment on column investment_strategies.updated_at is 'Timestamp of last strategy update (auto-updated by trigger)';

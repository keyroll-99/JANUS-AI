-- migration: create portfolio_snapshots table
-- description: creates table for storing daily portfolio value snapshots
-- tables affected: portfolio_snapshots
-- author: github copilot
-- date: 2025-10-19
-- note: stores historical portfolio values for generating performance charts

-- create portfolio_snapshots table
-- stores daily snapshots of portfolio value for historical tracking and chart generation
-- one snapshot per user per day (enforced by unique constraint)
create table if not exists portfolio_snapshots (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    snapshot_date date not null,
    total_value numeric(20, 4) not null check (total_value >= 0),
    cash_balance numeric(20, 4) not null default 0 check (cash_balance >= 0),
    invested_value numeric(20, 4) not null default 0 check (invested_value >= 0),
    realized_profit_loss numeric(20, 4) not null default 0,
    unrealized_profit_loss numeric(20, 4) not null default 0,
    created_at timestamp with time zone not null default now(),
    
    -- ensure one snapshot per user per day
    constraint unique_user_snapshot_date unique (user_id, snapshot_date)
);

-- enable row level security
-- ensures users can only view their own portfolio snapshots
alter table portfolio_snapshots enable row level security;

-- policy: authenticated users can select only their own snapshots
-- validates that the user_id matches the authenticated user's id
create policy snapshots_select_policy on portfolio_snapshots
    for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: authenticated users can insert only their own snapshots
-- used by system to create daily snapshots
create policy snapshots_insert_policy on portfolio_snapshots
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: authenticated users can update only their own snapshots
-- allows recalculation of snapshots if needed
create policy snapshots_update_policy on portfolio_snapshots
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own snapshots
-- allows cleanup of old or incorrect snapshots
create policy snapshots_delete_policy on portfolio_snapshots
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- create indexes for performance optimization
-- composite index for retrieving user's snapshots sorted by date (for charts)
create index if not exists idx_portfolio_snapshots_user_date on portfolio_snapshots(user_id, snapshot_date desc);

-- index on user_id for foreign key performance
create index if not exists idx_portfolio_snapshots_user_id on portfolio_snapshots(user_id);

-- index on snapshot_date for time-based queries
create index if not exists idx_portfolio_snapshots_date on portfolio_snapshots(snapshot_date desc);

-- add comments to table and columns for documentation
comment on table portfolio_snapshots is 'Stores daily snapshots of portfolio value for historical tracking and chart generation';
comment on column portfolio_snapshots.id is 'Primary key - unique identifier for snapshot';
comment on column portfolio_snapshots.user_id is 'Foreign key to auth.users - owner of portfolio';
comment on column portfolio_snapshots.snapshot_date is 'Date of this snapshot (one per user per day)';
comment on column portfolio_snapshots.total_value is 'Total portfolio value in PLN (cash + invested)';
comment on column portfolio_snapshots.cash_balance is 'Available cash balance in PLN';
comment on column portfolio_snapshots.invested_value is 'Total value invested in assets in PLN';
comment on column portfolio_snapshots.realized_profit_loss is 'Cumulative realized profit/loss in PLN from closed positions';
comment on column portfolio_snapshots.unrealized_profit_loss is 'Current unrealized profit/loss in PLN from open positions';
comment on column portfolio_snapshots.created_at is 'Timestamp when snapshot was created in database';

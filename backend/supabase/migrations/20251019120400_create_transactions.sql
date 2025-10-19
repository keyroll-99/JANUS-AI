-- migration: create transactions table
-- description: creates main table for storing all financial transactions
-- tables affected: transactions
-- author: github copilot
-- date: 2025-10-19
-- note: this is the core table storing all buy/sell/dividend/deposit/withdrawal operations

-- create transactions table
-- stores all financial operations for all users across all account types
-- supports both manual entry and bulk import from xtb excel files
create table if not exists transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    account_type_id integer not null references account_types(id) on delete restrict,
    transaction_type_id integer not null references transaction_types(id) on delete restrict,
    ticker varchar(20) null,
    quantity numeric(20, 8) null check (quantity > 0),
    price numeric(20, 4) null check (price > 0),
    total_amount numeric(20, 4) not null,
    commission numeric(20, 4) not null default 0 check (commission >= 0),
    transaction_date timestamp with time zone not null check (transaction_date <= now()),
    notes text null,
    imported_from_file boolean not null default false,
    import_batch_id uuid null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- enable row level security
-- ensures users can only access their own transactions
alter table transactions enable row level security;

-- policy: authenticated users can select only their own transactions
-- validates that the user_id matches the authenticated user's id
create policy transactions_select_policy on transactions
    for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: authenticated users can insert only their own transactions
-- validates that the user_id in the new row matches the authenticated user's id
create policy transactions_insert_policy on transactions
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: authenticated users can update only their own transactions
-- validates both the existing and new user_id match the authenticated user
create policy transactions_update_policy on transactions
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: authenticated users can delete only their own transactions
-- validates that the user_id matches the authenticated user's id
create policy transactions_delete_policy on transactions
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- create indexes for performance optimization
-- composite index for filtering user's transactions by date (most common query)
create index if not exists idx_transactions_user_date on transactions(user_id, transaction_date desc);

-- composite index for filtering user's transactions by account type
create index if not exists idx_transactions_user_account on transactions(user_id, account_type_id);

-- index for ticker lookups (portfolio diversity analysis)
-- partial index - only for transactions that have a ticker
create index if not exists idx_transactions_ticker on transactions(ticker) where ticker is not null;

-- index for grouping transactions from same import batch
-- partial index - only for imported transactions
create index if not exists idx_transactions_import_batch on transactions(import_batch_id) where import_batch_id is not null;

-- index for transaction date sorting and filtering
create index if not exists idx_transactions_transaction_date on transactions(transaction_date desc);

-- indexes on foreign keys (created automatically by postgresql but explicitly defined for clarity)
create index if not exists idx_transactions_user_id on transactions(user_id);
create index if not exists idx_transactions_account_type_id on transactions(account_type_id);
create index if not exists idx_transactions_transaction_type_id on transactions(transaction_type_id);

-- add comments to table and columns for documentation
comment on table transactions is 'Main table storing all financial transactions for all users';
comment on column transactions.id is 'Primary key - unique identifier for transaction';
comment on column transactions.user_id is 'Foreign key to auth.users - owner of this transaction';
comment on column transactions.account_type_id is 'Foreign key to account_types - type of investment account (MAIN/IKE/IKZE)';
comment on column transactions.transaction_type_id is 'Foreign key to transaction_types - type of operation (BUY/SELL/DIVIDEND/DEPOSIT/WITHDRAWAL/FEE)';
comment on column transactions.ticker is 'Stock ticker symbol - required for BUY/SELL/DIVIDEND, null for DEPOSIT/WITHDRAWAL/FEE';
comment on column transactions.quantity is 'Number of shares/units - required for BUY/SELL/DIVIDEND';
comment on column transactions.price is 'Price per unit in PLN - required for BUY/SELL/DIVIDEND';
comment on column transactions.total_amount is 'Total transaction value in PLN (always required)';
comment on column transactions.commission is 'Broker commission/fee in PLN (default: 0)';
comment on column transactions.transaction_date is 'Date and time when transaction was executed (cannot be in future)';
comment on column transactions.notes is 'Optional user notes about this transaction';
comment on column transactions.imported_from_file is 'Flag indicating if transaction was imported from XTB Excel file';
comment on column transactions.import_batch_id is 'UUID grouping transactions from same import file';
comment on column transactions.created_at is 'Timestamp when record was created in database';
comment on column transactions.updated_at is 'Timestamp of last record update (auto-updated by trigger)';

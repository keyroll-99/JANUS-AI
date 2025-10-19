-- migration: create reference tables for account and transaction types
-- description: creates account_types and transaction_types lookup tables with initial data
-- tables affected: account_types, transaction_types
-- author: github copilot
-- date: 2025-10-19

-- create account_types table
-- this table defines the types of investment accounts available in the system
-- values: MAIN (regular portfolio), IKE (individual retirement account), IKZE (individual retirement security account)
create table if not exists account_types (
    id serial primary key,
    name varchar(50) not null unique,
    description text null,
    created_at timestamp with time zone not null default now()
);

-- enable row level security on account_types
-- this table is read-only for all users
alter table account_types enable row level security;

-- policy: allow all authenticated and anonymous users to read account types
-- this is a reference table that all users need to access
create policy account_types_select_policy_anon on account_types
    for select
    to anon
    using (true);

create policy account_types_select_policy_authenticated on account_types
    for select
    to authenticated
    using (true);

-- insert initial account types
-- these represent the three main investment account categories in poland
insert into account_types (name, description) values
    ('MAIN', 'Główny portfel - standardowe konto inwestycyjne'),
    ('IKE', 'Indywidualne Konto Emerytalne - konto emerytalne z ulgami podatkowymi'),
    ('IKZE', 'Indywidualne Konto Zabezpieczenia Emerytalnego - dodatkowe konto emerytalne z ulgami')
on conflict (name) do nothing;

-- create transaction_types table
-- this table defines all possible transaction types in the system
create table if not exists transaction_types (
    id serial primary key,
    name varchar(50) not null unique,
    description text null,
    created_at timestamp with time zone not null default now()
);

-- enable row level security on transaction_types
-- this table is read-only for all users
alter table transaction_types enable row level security;

-- policy: allow all authenticated and anonymous users to read transaction types
-- this is a reference table that all users need to access
create policy transaction_types_select_policy_anon on transaction_types
    for select
    to anon
    using (true);

create policy transaction_types_select_policy_authenticated on transaction_types
    for select
    to authenticated
    using (true);

-- insert initial transaction types
-- these cover all possible operations in an investment account
insert into transaction_types (name, description) values
    ('BUY', 'Kupno akcji lub innych instrumentów finansowych'),
    ('SELL', 'Sprzedaż akcji lub innych instrumentów finansowych'),
    ('DIVIDEND', 'Otrzymanie dywidendy z posiadanych akcji'),
    ('DEPOSIT', 'Wpłata środków pieniężnych na konto'),
    ('WITHDRAWAL', 'Wypłata środków pieniężnych z konta'),
    ('FEE', 'Opłata lub prowizja pobrana przez brokera')
on conflict (name) do nothing;

-- create indexes for performance
create index if not exists idx_account_types_name on account_types(name);
create index if not exists idx_transaction_types_name on transaction_types(name);

-- add comments to tables and columns for documentation
comment on table account_types is 'Reference table defining available investment account types';
comment on column account_types.id is 'Primary key - unique identifier for account type';
comment on column account_types.name is 'Unique name of the account type (MAIN, IKE, IKZE)';
comment on column account_types.description is 'Human-readable description of the account type';

comment on table transaction_types is 'Reference table defining all possible transaction types';
comment on column transaction_types.id is 'Primary key - unique identifier for transaction type';
comment on column transaction_types.name is 'Unique name of the transaction type';
comment on column transaction_types.description is 'Human-readable description of the transaction type';

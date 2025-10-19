-- migration: create ai_recommendations table
-- description: creates table for storing specific ai recommendations per asset
-- tables affected: ai_recommendations
-- author: github copilot
-- date: 2025-10-19
-- note: child table of ai_analyses, stores granular recommendations for each ticker

-- create ai_recommendations table
-- stores specific ai recommendations for individual assets within an analysis
-- many-to-one relationship with ai_analyses (one analysis has many recommendations)
create table if not exists ai_recommendations (
    id uuid primary key default uuid_generate_v4(),
    analysis_id uuid not null references ai_analyses(id) on delete cascade,
    ticker varchar(20) not null,
    action varchar(20) not null check (action in ('BUY', 'SELL', 'HOLD', 'REDUCE', 'INCREASE')),
    confidence varchar(20) null check (confidence in ('LOW', 'MEDIUM', 'HIGH')),
    reasoning text not null,
    target_price numeric(20, 4) null check (target_price > 0),
    current_position_size numeric(20, 4) null check (current_position_size >= 0),
    suggested_allocation numeric(5, 2) null check (suggested_allocation >= 0 and suggested_allocation <= 100),
    created_at timestamp with time zone not null default now()
);

-- enable row level security
-- users can view recommendations from their own analyses only
alter table ai_recommendations enable row level security;

-- policy: authenticated users can select recommendations from their own analyses
-- validates that the analysis belongs to the authenticated user
create policy recommendations_select_policy on ai_recommendations
    for select
    to authenticated
    using (
        exists (
            select 1 from ai_analyses 
            where ai_analyses.id = ai_recommendations.analysis_id 
            and ai_analyses.user_id = auth.uid()
        )
    );

-- policy: authenticated users can insert recommendations for their own analyses
-- validates that the analysis belongs to the authenticated user
create policy recommendations_insert_policy on ai_recommendations
    for insert
    to authenticated
    with check (
        exists (
            select 1 from ai_analyses 
            where ai_analyses.id = ai_recommendations.analysis_id 
            and ai_analyses.user_id = auth.uid()
        )
    );

-- note: no update or delete policies - recommendations are read-only once created
-- deletion happens automatically when parent ai_analysis is deleted (cascade)

-- create indexes for performance optimization
-- composite index for retrieving all recommendations for a specific analysis
create index if not exists idx_ai_recommendations_analysis_id on ai_recommendations(analysis_id);

-- composite index for filtering recommendations by analysis and action type
create index if not exists idx_ai_recommendations_analysis_action on ai_recommendations(analysis_id, action);

-- index for searching recommendations by ticker across all analyses
create index if not exists idx_ai_recommendations_ticker on ai_recommendations(ticker);

-- index for filtering by confidence level
create index if not exists idx_ai_recommendations_confidence on ai_recommendations(confidence) where confidence is not null;

-- add comments to table and columns for documentation
comment on table ai_recommendations is 'Stores specific AI recommendations for individual assets within portfolio analyses';
comment on column ai_recommendations.id is 'Primary key - unique identifier for recommendation';
comment on column ai_recommendations.analysis_id is 'Foreign key to ai_analyses - parent analysis (cascade delete)';
comment on column ai_recommendations.ticker is 'Stock ticker symbol for this recommendation';
comment on column ai_recommendations.action is 'Recommended action: BUY (new position), INCREASE (add to existing), HOLD, REDUCE (partial sell), SELL (close position)';
comment on column ai_recommendations.confidence is 'AI confidence level in this recommendation: LOW, MEDIUM, HIGH';
comment on column ai_recommendations.reasoning is 'AI-generated explanation for this recommendation';
comment on column ai_recommendations.target_price is 'Suggested target price in PLN (optional)';
comment on column ai_recommendations.current_position_size is 'Current value of this position in portfolio in PLN (optional)';
comment on column ai_recommendations.suggested_allocation is 'Suggested allocation as percentage of total portfolio (0-100)';
comment on column ai_recommendations.created_at is 'Timestamp when recommendation was created';

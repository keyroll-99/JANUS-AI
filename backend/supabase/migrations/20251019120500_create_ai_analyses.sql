-- migration: create ai_analyses table
-- description: creates table for storing ai portfolio analysis history
-- tables affected: ai_analyses
-- author: github copilot
-- date: 2025-10-19
-- note: stores results of ai-powered portfolio analyses including cost tracking

-- create ai_analyses table
-- stores history of ai portfolio analyses with summary, cost, and metadata
-- each analysis can have multiple recommendations (stored in ai_recommendations table)
create table if not exists ai_analyses (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    analysis_summary text not null,
    portfolio_value numeric(20, 4) not null check (portfolio_value >= 0),
    ai_model varchar(50) not null,
    prompt_tokens integer null check (prompt_tokens >= 0),
    completion_tokens integer null check (completion_tokens >= 0),
    total_cost numeric(10, 6) null check (total_cost >= 0),
    analysis_date timestamp with time zone not null default now(),
    created_at timestamp with time zone not null default now()
);

-- enable row level security
-- ensures users can only view their own analyses
alter table ai_analyses enable row level security;

-- policy: authenticated users can select only their own analyses
-- validates that the user_id matches the authenticated user's id
create policy analyses_select_policy on ai_analyses
    for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: authenticated users can insert only their own analyses
-- used when system creates new analysis for the user
create policy analyses_insert_policy on ai_analyses
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own analyses
-- allows users to clean up old analyses if needed
create policy analyses_delete_policy on ai_analyses
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- note: no update policy - analyses are read-only once created
-- this maintains audit trail integrity

-- create indexes for performance optimization
-- composite index for retrieving user's analyses sorted by date (most recent first)
create index if not exists idx_ai_analyses_user_date on ai_analyses(user_id, analysis_date desc);

-- index on user_id for foreign key performance
create index if not exists idx_ai_analyses_user_id on ai_analyses(user_id);

-- index on analysis_date for time-based queries
create index if not exists idx_ai_analyses_date on ai_analyses(analysis_date desc);

-- index on ai_model for cost analysis and model comparison
create index if not exists idx_ai_analyses_model on ai_analyses(ai_model);

-- add comments to table and columns for documentation
comment on table ai_analyses is 'Stores history of AI-powered portfolio analyses';
comment on column ai_analyses.id is 'Primary key - unique identifier for analysis';
comment on column ai_analyses.user_id is 'Foreign key to auth.users - owner of analyzed portfolio';
comment on column ai_analyses.analysis_summary is 'General summary of portfolio state from AI';
comment on column ai_analyses.portfolio_value is 'Total portfolio value in PLN at time of analysis';
comment on column ai_analyses.ai_model is 'AI model used for analysis (e.g., claude-haiku-3, gemini-pro)';
comment on column ai_analyses.prompt_tokens is 'Number of tokens in the AI prompt (for cost tracking)';
comment on column ai_analyses.completion_tokens is 'Number of tokens in AI response (for cost tracking)';
comment on column ai_analyses.total_cost is 'Total cost of this analysis in USD';
comment on column ai_analyses.analysis_date is 'Date and time when analysis was performed';
comment on column ai_analyses.created_at is 'Timestamp when record was created in database';

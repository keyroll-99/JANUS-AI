-- migration: create full-text search indexes (optional)
-- description: creates full-text search indexes for future search features
-- tables affected: transactions, ai_recommendations
-- author: github copilot
-- date: 2025-10-19
-- note: these indexes are optional and can be created later when search functionality is needed
-- note: using 'simple' configuration which works universally (no language-specific stemming)

-- full-text search index for transaction notes
-- uses simple configuration for universal text search
-- partial index - only creates index for transactions that have notes
-- this index will enable fast searching through user notes on transactions
create index if not exists idx_transactions_notes_fts 
    on transactions 
    using gin(to_tsvector('simple', notes)) 
    where notes is not null;

-- full-text search index for ai recommendation reasoning
-- uses simple configuration for universal text search
-- this index will enable fast searching through ai-generated recommendation explanations
create index if not exists idx_ai_recommendations_reasoning_fts 
    on ai_recommendations 
    using gin(to_tsvector('simple', reasoning));

-- add comments for documentation
comment on index idx_transactions_notes_fts is 'Full-text search index for transaction notes (simple/universal configuration)';
comment on index idx_ai_recommendations_reasoning_fts is 'Full-text search index for AI recommendation reasoning (simple/universal configuration)';

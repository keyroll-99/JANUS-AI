-- migration: add analysis_prompt column to ai_analyses table
-- description: stores the exact prompt used for each AI analysis for debugging and optimization
-- tables affected: ai_analyses
-- author: github copilot
-- date: 2025-10-20

-- add analysis_prompt column to store the prompt text used for each analysis
alter table ai_analyses 
add column if not exists analysis_prompt text null;

-- add comment explaining the column's purpose
comment on column ai_analyses.analysis_prompt is 'Full prompt text sent to AI model for this analysis - useful for debugging and prompt optimization';

-- create index for searching by prompt content (useful for finding analyses with similar prompts)
create index if not exists idx_ai_analyses_prompt on ai_analyses using gin(to_tsvector('english', analysis_prompt));

-- note: column is nullable to support existing analyses without prompts
-- new analyses should always populate this field

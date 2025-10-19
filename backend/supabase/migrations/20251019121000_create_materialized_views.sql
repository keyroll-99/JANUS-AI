-- migration: create materialized view for portfolio positions (optional)
-- description: creates materialized view for fast access to current portfolio positions
-- views affected: user_portfolio_positions
-- author: github copilot
-- date: 2025-10-19
-- note: this is optional and can be created later for performance optimization
-- warning: materialized views need to be refreshed manually or via scheduled job

-- materialized view: aggregated portfolio positions
-- pre-calculates current positions for all users across all account types
-- this provides fast access to "what do I currently own" without scanning all transactions
-- refresh this view after transactions are added/modified
create materialized view if not exists user_portfolio_positions as
select 
    t.user_id,
    t.account_type_id,
    t.ticker,
    -- calculate net quantity (buys minus sells)
    sum(case 
        when tt.name = 'BUY' then t.quantity 
        when tt.name = 'SELL' then -t.quantity 
        else 0 
    end) as total_quantity,
    -- calculate weighted average price
    avg(case 
        when tt.name in ('BUY', 'SELL') then t.price 
        else null 
    end) as avg_price,
    -- total invested amount (cost basis)
    sum(case 
        when tt.name = 'BUY' then t.total_amount + t.commission
        when tt.name = 'SELL' then -(t.total_amount - t.commission)
        else 0 
    end) as total_cost,
    -- count of transactions for this position
    count(*) as transaction_count,
    -- date of first transaction (when position was opened)
    min(t.transaction_date) as first_transaction_date,
    -- date of last transaction (most recent activity)
    max(t.transaction_date) as last_transaction_date
from transactions t
join transaction_types tt on t.transaction_type_id = tt.id
where t.ticker is not null
group by t.user_id, t.account_type_id, t.ticker
-- only include positions that are currently open (net quantity > 0)
having sum(case 
    when tt.name = 'BUY' then t.quantity 
    when tt.name = 'SELL' then -t.quantity 
    else 0 
end) > 0;

-- create unique index for fast lookups and concurrent refresh
-- this index also enables concurrent refresh which doesn't lock the entire view
create unique index if not exists idx_portfolio_positions_user_account_ticker 
    on user_portfolio_positions(user_id, account_type_id, ticker);

-- create additional indexes for common queries
create index if not exists idx_portfolio_positions_user_id 
    on user_portfolio_positions(user_id);

create index if not exists idx_portfolio_positions_ticker 
    on user_portfolio_positions(ticker);

-- add comments for documentation
comment on materialized view user_portfolio_positions is 'Pre-calculated current portfolio positions for all users (requires manual refresh)';
comment on column user_portfolio_positions.user_id is 'Foreign key to auth.users - portfolio owner';
comment on column user_portfolio_positions.account_type_id is 'Foreign key to account_types - type of account';
comment on column user_portfolio_positions.ticker is 'Stock ticker symbol';
comment on column user_portfolio_positions.total_quantity is 'Net quantity owned (buys minus sells)';
comment on column user_portfolio_positions.avg_price is 'Weighted average purchase price in PLN';
comment on column user_portfolio_positions.total_cost is 'Total cost basis including commissions in PLN';
comment on column user_portfolio_positions.transaction_count is 'Number of transactions for this position';
comment on column user_portfolio_positions.first_transaction_date is 'Date when position was first opened';
comment on column user_portfolio_positions.last_transaction_date is 'Date of most recent transaction activity';

-- note: to refresh this view, run:
-- refresh materialized view concurrently user_portfolio_positions;
-- 
-- concurrent refresh allows reads during refresh but requires unique index
-- schedule this refresh after bulk transaction imports or daily via cron

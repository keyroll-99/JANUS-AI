-- migration: create helper functions and triggers
-- description: creates functions for auto-updating timestamps and validating transactions
-- tables affected: transactions, investment_strategies, user_rate_limits
-- author: github copilot
-- date: 2025-10-19

-- function: automatically update updated_at column on row update
-- this function is used by triggers to keep updated_at current
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- trigger: auto-update updated_at on transactions table
-- fires before any update to ensure updated_at reflects modification time
create trigger update_transactions_updated_at
    before update on transactions
    for each row
    execute function update_updated_at_column();

-- trigger: auto-update updated_at on investment_strategies table
-- fires before any update to ensure updated_at reflects modification time
create trigger update_investment_strategies_updated_at
    before update on investment_strategies
    for each row
    execute function update_updated_at_column();

-- trigger: auto-update updated_at on user_rate_limits table
-- fires before any update to ensure updated_at reflects modification time
create trigger update_user_rate_limits_updated_at
    before update on user_rate_limits
    for each row
    execute function update_updated_at_column();

-- function: validate transaction data integrity
-- ensures that buy/sell/dividend transactions have required fields (ticker, quantity, price)
-- auto-calculates total_amount if not provided for trading transactions
create or replace function validate_transaction()
returns trigger as $$
declare
    v_transaction_type_name varchar(50);
begin
    -- get the transaction type name
    select name into v_transaction_type_name
    from transaction_types
    where id = new.transaction_type_id;
    
    -- for buy/sell/dividend transactions, require ticker, quantity, and price
    if v_transaction_type_name in ('BUY', 'SELL', 'DIVIDEND') then
        if new.ticker is null then
            raise exception 'Ticker is required for % transactions', v_transaction_type_name;
        end if;
        
        if new.quantity is null then
            raise exception 'Quantity is required for % transactions', v_transaction_type_name;
        end if;
        
        if new.price is null then
            raise exception 'Price is required for % transactions', v_transaction_type_name;
        end if;
        
        -- auto-calculate total_amount if not provided
        -- this helps maintain data consistency
        if new.total_amount is null then
            new.total_amount = new.quantity * new.price;
        end if;
    end if;
    
    return new;
end;
$$ language plpgsql;

-- trigger: validate transaction data before insert or update
-- ensures data integrity for all transaction types
create trigger validate_transaction_trigger
    before insert or update on transactions
    for each row
    execute function validate_transaction();

-- function: reset daily analysis count and increment counters
-- automatically resets daily_analyses_count when a new day starts
-- increments monthly and total counters
create or replace function reset_daily_analysis_count()
returns trigger as $$
begin
    -- if last analysis was on a different day (or never), reset daily counter
    if new.last_analysis_date is null or new.last_analysis_date < current_date then
        new.daily_analyses_count = 1;
        new.last_analysis_date = current_date;
    else
        -- same day - just increment
        new.daily_analyses_count = new.daily_analyses_count + 1;
    end if;
    
    -- always increment monthly and total counters
    new.monthly_analyses_count = new.monthly_analyses_count + 1;
    new.total_analyses_count = new.total_analyses_count + 1;
    
    return new;
end;
$$ language plpgsql;

-- trigger: automatically manage analysis counters
-- fires when daily_analyses_count is incremented (indicating new analysis)
-- note: this trigger only fires when the counter actually changes
create trigger increment_analysis_count
    before update on user_rate_limits
    for each row
    when (new.daily_analyses_count > old.daily_analyses_count or old.daily_analyses_count is null)
    execute function reset_daily_analysis_count();

-- add comments to functions for documentation
comment on function update_updated_at_column() is 'Trigger function that automatically updates updated_at timestamp on row modification';
comment on function validate_transaction() is 'Trigger function that validates transaction data integrity and auto-calculates total_amount for trading transactions';
comment on function reset_daily_analysis_count() is 'Trigger function that manages daily/monthly/total analysis counters with automatic daily reset';

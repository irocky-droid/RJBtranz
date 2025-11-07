# Supabase Setup Instructions for RJB TRANZ CRM

## Overview
This document provides step-by-step instructions to set up Supabase integration with the RJB TRANZ CRM system.

## Prerequisites
- Supabase account
- Project URL: `https://ijnskyrnmoyhtmfdazdk.supabase.co`
- Anon Public Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbnNreXJubW95aHRtZmRhemRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTk0MjEsImV4cCI6MjA3NDgzNTQyMX0.MAwV7HRgYRKKSBUVbfIqGW4ighagH-NzYDlM1Uooauc`

## Database Schema Setup

### 1. Create Tables

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Currencies table
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(5) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    country_code VARCHAR(2),
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get comprehensive dashboard analytics
CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'transactions', (
            SELECT jsonb_build_object(
                'total_volume', COALESCE(SUM(base_currency_amount), 0),
                'total_revenue', COALESCE(SUM(fee), 0), -- Assuming fee is in base currency or needs conversion
                'total_count', COUNT(*),
                'status_counts', (
                    SELECT jsonb_object_agg(status, count)
                    FROM (
                        SELECT status, COUNT(*) as count
                        FROM transactions
                        GROUP BY status
                    ) AS status_counts
                )
            )
            FROM transactions
        ),
        'clients', (
            SELECT jsonb_build_object(
                'total_count', COUNT(*),
                'verification_status_counts', (
                    SELECT jsonb_object_agg(verification_status, count)
                    FROM (
                        SELECT verification_status, COUNT(*) as count
                        FROM clients
                        GROUP BY verification_status
                    ) AS verification_counts
                )
            )
            FROM clients
        ),
        'invoices', (
            SELECT jsonb_build_object(
                'total_count', COUNT(*),
                'status_counts', (
                    SELECT jsonb_object_agg(status, count)
                    FROM (
                        SELECT status, COUNT(*) as count
                        FROM invoices
                        GROUP BY status
                    ) AS invoice_status_counts
                )
            )
            FROM invoices
        ),
        'periods', (
            SELECT jsonb_build_object(
                'today', (SELECT jsonb_build_object('volume', COALESCE(SUM(base_currency_amount), 0), 'revenue', COALESCE(SUM(fee), 0)) FROM transactions WHERE created_at >= NOW() - INTERVAL '1 day'),
                'last_7_days', (SELECT jsonb_build_object('volume', COALESCE(SUM(base_currency_amount), 0), 'revenue', COALESCE(SUM(fee), 0)) FROM transactions WHERE created_at >= NOW() - INTERVAL '7 days'),
                'last_30_days', (SELECT jsonb_build_object('volume', COALESCE(SUM(base_currency_amount), 0), 'revenue', COALESCE(SUM(fee), 0)) FROM transactions WHERE created_at >= NOW() - INTERVAL '30 days')
            )
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Index for pinned currencies
CREATE INDEX IF NOT EXISTS idx_currencies_is_pinned ON currencies(is_pinned);

-- Status and Type definition tables to remove hardcoding
CREATE TABLE IF NOT EXISTS transaction_statuses (
    name VARCHAR(20) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_types (
    name VARCHAR(20) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_verification_statuses (
    name VARCHAR(20) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_statuses (
    name VARCHAR(20) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remove CHECK constraints from existing tables before altering columns
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    amount DECIMAL(15,2) NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    exchange_rate DECIMAL(15,8) NOT NULL,
    fee DECIMAL(15,2) NOT NULL,    
    status VARCHAR(20) NOT NULL REFERENCES transaction_statuses(name),
    transaction_type VARCHAR(20) NOT NULL REFERENCES transaction_types(name),
    unique_id VARCHAR(255) UNIQUE,
    format_id VARCHAR(255) UNIQUE,
    unique_code VARCHAR(255) UNIQUE,
    base_currency_amount DECIMAL(15,2) DEFAULT 0.00,
    receipt_printed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remove CHECK constraint from clients table before altering column
ALTER TABLE IF EXISTS clients DROP CONSTRAINT IF EXISTS clients_verification_status_check;

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    total_transactions INTEGER DEFAULT 0,
    country VARCHAR(100),
    city VARCHAR(100),
    total_volume DECIMAL(15,2) DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' REFERENCES client_verification_statuses(name),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to convert transaction amount to base currency
CREATE OR REPLACE FUNCTION convert_to_base_currency()
RETURNS TRIGGER AS $$
DECLARE
    base_curr VARCHAR(5);
    conversion_rate DECIMAL;
BEGIN
    -- 1. Get the system's base currency
    SELECT base_currency INTO base_curr FROM public.system_config LIMIT 1;

    -- 2. If the transaction is already in the base currency, just copy the amount
    IF NEW.from_currency = base_curr THEN
        NEW.base_currency_amount := NEW.amount;
    ELSE
        -- 3. Find the direct exchange rate from the transaction currency to the base currency
        SELECT rate INTO conversion_rate
        FROM public.exchange_rates
        WHERE from_currency = NEW.from_currency AND to_currency = base_curr;

        -- 4. If a direct rate is found, calculate and update the base_currency_amount
        IF FOUND THEN
            NEW.base_currency_amount := NEW.amount * conversion_rate;
        ELSE
            -- 5. If no direct rate, try to convert through an intermediate currency (e.g., USD)
            -- This part can be expanded with more complex logic if needed
            -- For now, we will leave it as 0 and log a warning if no rate is found.
            NEW.base_currency_amount := 0.00;
            RAISE WARNING 'No direct exchange rate found from % to %. Transaction ID: %', NEW.from_currency, base_curr, NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the conversion function after a new transaction is inserted
CREATE TRIGGER transactions_after_insert_trigger
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION convert_to_base_currency();

-- Optional: To backfill existing data, you can run an UPDATE statement.
-- This is commented out by default.
/*
UPDATE transactions t
SET base_currency_amount = (
    SELECT t.amount * er.rate
    FROM exchange_rates er
    WHERE er.from_currency = t.from_currency AND er.to_currency = (SELECT base_currency FROM system_config LIMIT 1)
)
WHERE t.base_currency_amount = 0.00;
*/

-- Exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair VARCHAR(10) NOT NULL UNIQUE,
    from_currency VARCHAR(5) NOT NULL,
    to_currency VARCHAR(5) NOT NULL,
    rate DECIMAL(15,8) NOT NULL,
    change DECIMAL(15,8) DEFAULT 0,
    change_percent DECIMAL(8,4) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_currency, to_currency)
);

-- Remove CHECK constraint from invoices table before altering column
ALTER TABLE IF EXISTS invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255),
    sender_phone VARCHAR(50),
    sender_country VARCHAR(100),
    sender_currency VARCHAR(10),
    sender_amount DECIMAL(15,2) NOT NULL,
    receiver_name VARCHAR(255) NOT NULL,
    receiver_email VARCHAR(255),
    receiver_phone VARCHAR(50),
    receiver_country VARCHAR(100),
    receiver_currency VARCHAR(10),
    receiver_amount DECIMAL(15,2),
    fee_amount DECIMAL(15,2),
    fee_rate DECIMAL(8,4),
    fee_currency VARCHAR(10),
    exchange_rate DECIMAL(15,8),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' REFERENCES invoice_statuses(name),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(5) NOT NULL REFERENCES currencies(code),
    config_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity tracking table (for real-time status)
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT FALSE,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Create Indexes for Performance

```sql
-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_client_email ON transactions(client_email);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_verification_status ON clients(verification_status);
CREATE INDEX IF NOT EXISTS idx_clients_last_visit ON clients(last_visit DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(pair);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_last_updated ON exchange_rates(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_activity ON user_activity(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_is_online ON user_activity(is_online);
```

### 3. Set up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON transactions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON exchange_rates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON invoices
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON system_config
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON user_activity
    FOR ALL USING (auth.role() = 'authenticated');
```

### 4. Insert Sample Data (Optional)

You should populate the `currencies` table with all the currencies your application will support. The `is_pinned` column can be set to `true` for currencies you want to appear in the base currency selection dropdown.

```sql
-- Sample pinned currencies
INSERT INTO currencies (code, name, symbol, country_code, is_pinned) VALUES
('GHS', 'Ghanaian Cedi', '₵', 'GH', TRUE),
('NGN', 'Nigerian Naira', '₦', 'NG', TRUE),
('USD', 'US Dollar', '$', 'US', TRUE),
('EUR', 'Euro', '€', 'EU', TRUE),
('GBP', 'British Pound', '£', 'GB', TRUE),
('KES', 'Kenyan Shilling', 'KSh', 'KE', FALSE),
('INR', 'Indian Rupee', '₹', 'IN', FALSE),
('PHP', 'Philippine Peso', '₱', 'PH', FALSE)
ON CONFLICT (pair) DO UPDATE SET
    rate = EXCLUDED.rate,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    last_updated = EXCLUDED.last_updated;

-- Populate status and type tables
INSERT INTO transaction_statuses (name, description) VALUES
('pending', 'Transaction is awaiting processing.'),
('completed', 'Transaction has been successfully completed.'),
('failed', 'Transaction has failed.'),
('cancelled', 'Transaction has been cancelled.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO transaction_types (name, description) VALUES
('send', 'A transaction to send money.'),
('receive', 'A transaction to receive money.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO client_verification_statuses (name, description) VALUES
('pending', 'Client verification is pending.'),
('verified', 'Client has been successfully verified.'),
('rejected', 'Client verification has been rejected.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO invoice_statuses (name, description) VALUES
('draft', 'Invoice is a draft and not yet sent.'),
('sent', 'Invoice has been sent to the client.'),
('paid', 'Invoice has been paid.'),
('overdue', 'Invoice is past its due date.'),
('cancelled', 'Invoice has been cancelled.')
ON CONFLICT (name) DO NOTHING;
```

## Testing the Connection

1. **In the RJB TRANZ CRM System Settings:**
   - Navigate to System Settings (click on your profile avatar)
   - Go to the "System" step
   - In the Database section, click the "Test" button next to "Supabase Connection"
   - You should see a success message if the connection works

2. **Manual Testing:**
   - You can also test the connection using the SupabaseTest component
   - Or run queries directly in the Supabase dashboard

## Environment Configuration

The connection details are already configured in the application:
- URL: `https://ijnskyrnmoyhtmfdazdk.supabase.co`
- Key: Already embedded in the application

## Features Available

Once set up, you can:

1. **Test Connection**: Click the test button in System Settings
2. **Sync Local Data**: Export your local CRM data to Supabase
3. **Real-time Updates**: Data will sync between local storage and Supabase
4. **Backup & Restore**: Your data is safely stored in the cloud
5. **User Management**: Super admin panel for user approval/denial
6. **Activity Tracking**: Real-time user activity monitoring ("active now", "last active X time ago")
7. **Admin Authorization**: Secure super admin access with email verification

## Troubleshooting

### Common Issues:

1. **Connection Failed**
   - Check if your Supabase project is active
   - Verify the URL and API key are correct
   - Ensure tables are created properly

2. **Permission Denied**
   - Check Row Level Security policies
   - Ensure your API key has the correct permissions

3. **Table Not Found**
   - Run the table creation SQL scripts
   - Check table names match exactly

### Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project status
3. Ensure all SQL scripts ran successfully
4. Check the Network tab for API call failures

## Security Notes

- The anon key is safe to use in client-side applications
- Row Level Security is enabled to protect data
- All connections use HTTPS encryption
- Consider implementing additional authentication for production use

## Next Steps

After setup:
1. Test the connection using the System Settings
2. Sync your existing local data to Supabase
3. Monitor the connection status in the CRM dashboard
4. Set up regular backups and monitoring
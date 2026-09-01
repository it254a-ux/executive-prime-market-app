-- Run against your Neon database. Replaces the earlier payments.sql —
-- drop bot_products / services if you already ran the old version:
--   DROP TABLE IF EXISTS bot_products;
--   DROP TABLE IF EXISTS services;

CREATE TABLE IF NOT EXISTS bot_requests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,             -- email, phone, or WhatsApp — whatever they gave
  strategy_details TEXT NOT NULL,    -- everything the client typed about the bot they want
  amount_usd NUMERIC(10, 2) NOT NULL, -- what the client chose to pay
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_requests (
  id SERIAL PRIMARY KEY,
  service_type TEXT NOT NULL DEFAULT 'account_management', -- future services reuse this table with a different service_type
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'invoiced', 'paid', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  bot_request_id INTEGER NOT NULL REFERENCES bot_requests(id),
  amount_usd NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  gateway_payment_id TEXT, -- id returned by Deriv Merchant for this checkout
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_gateway_payment_id ON orders (gateway_payment_id);

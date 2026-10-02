-- Track Paystack initializations so verify step can reconcile payments.
create table if not exists pending_payments (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  user_id uuid references profiles(id),
  payload jsonb not null,
  subtotal integer not null,
  delivery_fee integer not null,
  total integer not null,
  status text default 'initialized',
  created_at timestamptz default now()
);
create index if not exists idx_pending_ref on pending_payments(reference);
alter table pending_payments enable row level security;
-- Only the service role touches this table; no public policies.

-- Record which payment created the order.
alter table orders add column if not exists payment_reference text;
alter table orders add column if not exists payment_status text default 'unpaid';

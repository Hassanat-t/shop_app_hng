-- Payments hardening. Run AFTER schema.sql and paystack.sql (Supabase SQL Editor).
-- Safe to run more than once.
--
-- 1. One order per Paystack reference: a unique index on orders.payment_reference.
-- 2. Atomic order creation: place_order() inserts the order AND its items in one
--    transaction, so an order can never exist without its items.
-- 3. Idempotent: calling place_order() again with the same reference (page refresh,
--    retried request, or the webhook arriving too) returns the existing order
--    instead of creating a second one.

-- Line items paid for are stored at init, so the webhook can build the exact order.
alter table pending_payments add column if not exists lines jsonb;

create unique index if not exists orders_payment_reference_key
  on orders (payment_reference)
  where payment_reference is not null;

create or replace function place_order(p_order jsonb, p_items jsonb, p_reference text default null)
returns table (order_id uuid, order_number text, created boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_number text;
begin
  if p_reference is not null then
    -- Serialise concurrent attempts for the same payment (verify page + webhook).
    perform 1 from pending_payments where reference = p_reference for update;

    select o.id, o.order_number into v_id, v_number
    from orders o
    where o.payment_reference = p_reference;

    if found then
      return query select v_id, v_number, false;
      return;
    end if;
  end if;

  insert into orders (
    user_id, order_number, customer_name, email, phone, fulfilment_method,
    delivery_address, notes, subtotal, delivery_fee, total, status,
    payment_reference, payment_status
  ) values (
    (p_order->>'user_id')::uuid,
    p_order->>'order_number',
    p_order->>'customer_name',
    p_order->>'email',
    p_order->>'phone',
    p_order->>'fulfilment_method',
    coalesce(p_order->>'delivery_address', ''),
    coalesce(p_order->>'notes', ''),
    (p_order->>'subtotal')::integer,
    (p_order->>'delivery_fee')::integer,
    (p_order->>'total')::integer,
    case when p_reference is null then 'pending' else 'paid' end,
    p_reference,
    case when p_reference is null then 'unpaid' else 'paid' end
  )
  returning id into v_id;

  insert into order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
  select
    v_id,
    case when (i->>'product_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         then (i->>'product_id')::uuid end,
    i->>'product_name',
    (i->>'unit_price')::integer,
    (i->>'quantity')::integer,
    (i->>'line_total')::integer
  from jsonb_array_elements(p_items) as i;

  if p_reference is not null then
    update pending_payments set status = 'completed' where reference = p_reference;
  end if;

  return query select v_id, p_order->>'order_number', true;

exception when unique_violation then
  -- Another request created the order for this reference first: return that one.
  -- (A clash on order_number with no reference re-raises; the API retries with a new number.)
  if p_reference is not null then
    return query
      select o.id, o.order_number, false
      from orders o
      where o.payment_reference = p_reference;
  else
    raise;
  end if;
end;
$$;

-- Only the server (service role) may create orders through this function.
revoke all on function place_order(jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function place_order(jsonb, jsonb, text) to service_role;

-- Artecium Platform — unique Stripe Checkout session reference on payments
-- Run AFTER 001–009
--
-- Enforces idempotency at the database layer for webhook fulfillment
-- (transaction_reference = Stripe Checkout Session ID cs_...).
-- NULL values are allowed (demo/manual payments without a session reference).

create unique index if not exists idx_payments_transaction_reference_unique
  on public.payments (transaction_reference)
  where transaction_reference is not null;

comment on index public.idx_payments_transaction_reference_unique is
  'One payment row per Stripe Checkout Session; supports webhook idempotency.';

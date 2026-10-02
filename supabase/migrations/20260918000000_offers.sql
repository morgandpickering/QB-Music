-- Make an Offer — v1 (quattlebaum-offers-001)
--
-- Offers on used/vintage stock, reviewed by hand. An accepted offer is a
-- negotiation record only: no payment, no inventory reservation.
--
-- Access model
--   anon           nothing. The public site never talks to these tables.
--   authenticated  SELECT only, and RLS narrows that to addresses listed in
--                  offer_staff. Changes go through staff_respond_to_offer().
--   service_role   the site's server route (SUPABASE_SECRET_KEY) calls
--                  submit_offer(). The key never reaches a browser.
--
-- offer_events is append-only: UPDATE, DELETE and TRUNCATE raise, and an
-- offer cannot be deleted while it has events (every offer has one).
--
-- Apply once: Supabase dashboard -> SQL Editor -> paste -> Run, or
-- `supabase db push` from a linked CLI. Run it once; it is not idempotent.
-- Then check it with supabase/tests/offers_smoke.sql.

begin;

/* ---- Staff allow-list --------------------------------------------------- */

create table public.offer_staff (
  email text primary key check (email = lower(email) and position('@' in email) > 1)
);

insert into public.offer_staff (email) values ('mr.cometwebsites@gmail.com');

/* ---- Offers ------------------------------------------------------------- */

create table public.offers (
  id uuid primary key default gen_random_uuid(),

  -- Snapshot of the catalogue as the SERVER priced it at submission. The
  -- browser never supplies any of these; see src/app/api/offers/route.ts.
  product_id text not null check (char_length(product_id) between 1 and 64),
  product_slug text not null check (char_length(product_slug) between 1 and 200),
  product_name text not null check (char_length(product_name) between 1 and 300),
  product_condition text not null check (product_condition in ('used', 'vintage')),
  listed_price_cents integer not null check (listed_price_cents > 0),

  amount_cents integer not null check (amount_cents > 0),
  counter_amount_cents integer,

  customer_name text not null check (char_length(customer_name) between 1 and 120),
  customer_email text not null check (
    char_length(customer_email) between 3 and 200
    and customer_email = lower(customer_email)
    and customer_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  customer_phone text check (customer_phone is null or char_length(customer_phone) between 1 and 40),
  fulfillment text not null check (fulfillment in ('pickup', 'shipping')),
  message text check (message is null or char_length(message) between 1 and 1000),
  terms_version text not null check (char_length(terms_version) between 1 and 40),

  status text not null default 'pending'
    check (status in ('pending', 'countered', 'accepted', 'declined', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The 80% floor, enforced here as well as in the app. bigint: no overflow.
  constraint offers_minimum_80_percent
    check (amount_cents::bigint * 5 >= listed_price_cents::bigint * 4),
  constraint offers_not_above_list check (amount_cents <= listed_price_cents),
  constraint offers_counter_range check (
    counter_amount_cents is null
    or (counter_amount_cents > amount_cents and counter_amount_cents <= listed_price_cents)
  ),
  constraint offers_countered_has_amount
    check (status <> 'countered' or counter_amount_cents is not null),
  constraint offers_expiry_after_creation check (expires_at > created_at)
);

-- One open offer per buyer per item.
create unique index offers_one_open_per_buyer
  on public.offers (product_id, customer_email)
  where status in ('pending', 'countered');

create index offers_open_by_expiry on public.offers (expires_at)
  where status in ('pending', 'countered');
create index offers_by_created on public.offers (created_at desc);
create index offers_by_email on public.offers (customer_email, created_at desc);

/* ---- Events (append-only) ----------------------------------------------- */

create table public.offer_events (
  id bigint generated always as identity primary key,
  offer_id uuid not null references public.offers (id) on delete restrict,
  event_type text not null
    check (event_type in ('submitted', 'countered', 'accepted', 'declined', 'expired')),
  from_status text check (from_status in ('pending', 'countered')),
  to_status text not null
    check (to_status in ('pending', 'countered', 'accepted', 'declined', 'expired')),
  amount_cents integer check (amount_cents is null or amount_cents > 0),
  note text check (note is null or char_length(note) between 1 and 1000),
  actor text not null check (actor in ('customer', 'staff', 'system')),
  actor_email text,
  created_at timestamptz not null default now(),
  constraint offer_events_staff_named check ((actor = 'staff') = (actor_email is not null))
);

create index offer_events_by_offer on public.offer_events (offer_id, created_at);

create function public.offer_events_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'offer_events is append-only' using errcode = '42501';
end;
$$;

create trigger offer_events_no_update_delete
  before update or delete on public.offer_events
  for each row execute function public.offer_events_append_only();

create trigger offer_events_no_truncate
  before truncate on public.offer_events
  for each statement execute function public.offer_events_append_only();

/* ---- Offer row guard: frozen facts, legal transitions ------------------- */

create function public.offers_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.id, new.product_id, new.product_slug, new.product_name, new.product_condition,
      new.listed_price_cents, new.amount_cents, new.customer_name, new.customer_email,
      new.customer_phone, new.fulfillment, new.message, new.terms_version, new.created_at)
     is distinct from
     (old.id, old.product_id, old.product_slug, old.product_name, old.product_condition,
      old.listed_price_cents, old.amount_cents, old.customer_name, old.customer_email,
      old.customer_phone, old.fulfillment, old.message, old.terms_version, old.created_at)
  then
    raise exception 'submitted offer details cannot be changed' using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if old.status not in ('pending', 'countered') then
      raise exception 'offer is already %', old.status using errcode = 'P0001';
    end if;
    if new.status not in ('countered', 'accepted', 'declined', 'expired') then
      raise exception 'illegal transition % -> %', old.status, new.status using errcode = 'P0001';
    end if;
  elsif new.status <> 'countered' or old.status <> 'countered' then
    -- Only a re-counter may touch an offer without changing its status.
    if (new.counter_amount_cents, new.expires_at)
       is distinct from (old.counter_amount_cents, old.expires_at) then
      raise exception 'offer can only change through a status transition' using errcode = 'P0001';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger offers_guard
  before update on public.offers
  for each row execute function public.offers_guard();

/* ---- Functions ---------------------------------------------------------- */

create function public.is_offer_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'authenticated'
     and exists (
       select 1 from public.offer_staff s
       where s.email = lower(coalesce(auth.jwt() ->> 'email', ''))
     );
$$;

-- Sweeps pending/countered offers past their deadline to 'expired'.
create function public.expire_stale_offers()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' and not public.is_offer_staff() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  with stale as (
    select id, status from public.offers
    where status in ('pending', 'countered') and expires_at <= now()
    for update skip locked
  ), expired as (
    update public.offers o set status = 'expired'
    from stale where o.id = stale.id
    returning o.id, stale.status as from_status
  )
  insert into public.offer_events (offer_id, event_type, from_status, to_status, actor)
  select id, 'expired', from_status, 'expired', 'system' from expired;

  get diagnostics n = row_count;
  return n;
end;
$$;

-- Called only by the site's server route with the secret key. Every product
-- field is the server's own catalogue lookup, never the browser's.
create function public.submit_offer(
  p_product_id text,
  p_product_slug text,
  p_product_name text,
  p_product_condition text,
  p_listed_price_cents integer,
  p_amount_cents integer,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_fulfillment text,
  p_message text,
  p_terms_version text
)
returns table (id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_customer_email));
  v_id uuid;
  v_expires timestamptz;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  perform public.expire_stale_offers();

  -- Abuse cap: a handful of open offers per address, across all items.
  if (select count(*) from public.offers o
      where o.customer_email = v_email and o.status in ('pending', 'countered')) >= 3 then
    raise exception 'open offer limit reached' using errcode = 'P0001', hint = 'open_offer_limit';
  end if;

  insert into public.offers (
    product_id, product_slug, product_name, product_condition, listed_price_cents,
    amount_cents, customer_name, customer_email, customer_phone, fulfillment,
    message, terms_version, expires_at
  ) values (
    p_product_id, p_product_slug, p_product_name, p_product_condition, p_listed_price_cents,
    p_amount_cents, p_customer_name, v_email, nullif(p_customer_phone, ''), p_fulfillment,
    nullif(p_message, ''), p_terms_version, now() + interval '48 hours'
  )
  returning offers.id, offers.expires_at into v_id, v_expires;

  insert into public.offer_events (offer_id, event_type, to_status, amount_cents, actor)
  values (v_id, 'submitted', 'pending', p_amount_cents, 'customer');

  return query select v_id, v_expires;
end;
$$;

-- Staff decision. Runs as the signed-in staff member's JWT; the staff check
-- is here, not just in the app. Returns the resulting status ('expired' when
-- the deadline had already passed, in which case nothing else changed).
create function public.staff_respond_to_offer(
  p_offer_id uuid,
  p_action text,
  p_counter_amount_cents integer default null,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.offers;
  v_staff text := lower(auth.jwt() ->> 'email');
  v_to text;
  v_amount integer;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if not public.is_offer_staff() then
    raise exception 'staff only' using errcode = '42501';
  end if;
  if p_action not in ('accept', 'counter', 'decline') then
    raise exception 'unknown action' using errcode = '22023';
  end if;

  select * into o from public.offers where offers.id = p_offer_id for update;
  if not found then
    raise exception 'offer not found' using errcode = 'P0002';
  end if;
  if o.status not in ('pending', 'countered') then
    raise exception 'offer is already %', o.status using errcode = 'P0001';
  end if;

  if o.expires_at <= now() then
    update public.offers set status = 'expired' where offers.id = o.id;
    insert into public.offer_events (offer_id, event_type, from_status, to_status, actor)
    values (o.id, 'expired', o.status, 'expired', 'system');
    return 'expired';
  end if;

  if p_action = 'counter' then
    if p_counter_amount_cents is null
       or p_counter_amount_cents <= o.amount_cents
       or p_counter_amount_cents > o.listed_price_cents then
      raise exception 'counter must be above the offer and no more than the listed price'
        using errcode = '22023';
    end if;
    update public.offers
       set status = 'countered',
           counter_amount_cents = p_counter_amount_cents,
           expires_at = now() + interval '48 hours'
     where offers.id = o.id;
    v_to := 'countered';
    v_amount := p_counter_amount_cents;
  elsif p_action = 'accept' then
    update public.offers set status = 'accepted' where offers.id = o.id;
    v_to := 'accepted';
    -- Accepting after a counter means the buyer agreed to the counter.
    v_amount := coalesce(o.counter_amount_cents, o.amount_cents);
  else
    update public.offers set status = 'declined' where offers.id = o.id;
    v_to := 'declined';
  end if;

  insert into public.offer_events
    (offer_id, event_type, from_status, to_status, amount_cents, note, actor, actor_email)
  values
    (o.id, case v_to when 'countered' then 'countered' when 'accepted' then 'accepted' else 'declined' end,
     o.status, v_to, v_amount, v_note, 'staff', v_staff);

  return v_to;
end;
$$;

/* ---- RLS and grants ----------------------------------------------------- */

alter table public.offer_staff enable row level security;
alter table public.offers enable row level security;
alter table public.offer_events enable row level security;

-- Supabase's default privileges grant everything to anon/authenticated on new
-- public objects. Take it all back, then grant exactly what is needed.
-- service_role loses direct writes too: every change goes through the
-- security-definer functions below, so every change leaves an event.
revoke all on public.offer_staff, public.offers, public.offer_events
  from public, anon, authenticated, service_role;
grant select on public.offers, public.offer_events to authenticated, service_role;

create policy offers_staff_read on public.offers
  for select to authenticated using (public.is_offer_staff());
create policy offer_events_staff_read on public.offer_events
  for select to authenticated using (public.is_offer_staff());
-- offer_staff has no policies: invisible to anon/authenticated.

revoke execute on function
  public.offer_events_append_only(),
  public.offers_guard(),
  public.is_offer_staff(),
  public.expire_stale_offers(),
  public.submit_offer(text, text, text, text, integer, integer, text, text, text, text, text, text),
  public.staff_respond_to_offer(uuid, text, integer, text)
from public, anon, authenticated;

grant execute on function public.is_offer_staff() to authenticated, service_role;
grant execute on function public.expire_stale_offers() to authenticated, service_role;
grant execute on function
  public.submit_offer(text, text, text, text, integer, integer, text, text, text, text, text, text)
to service_role;
grant execute on function public.staff_respond_to_offer(uuid, text, integer, text) to authenticated;

commit;

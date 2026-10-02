-- Smoke test for 20260918000000_offers.sql. Paste into the SQL Editor after
-- applying the migration. Everything runs in one transaction and is rolled
-- back, so it leaves no rows behind. Any failure raises; success ends with
-- the notice 'offers smoke test: all checks passed'.

begin;

do $$
declare
  v_id uuid;
  v_status text;
  failed boolean;
begin
  -- As the site's server (secret key).
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  set local role service_role;

  select id into v_id from public.submit_offer(
    'QM-TEST-1', 'smoke-test-item', 'Smoke Test Item', 'used', 10000,
    8000, 'Smoke Test', 'Smoke@Example.com', null, 'pickup', null, 'test');
  assert v_id is not null, 'submit_offer returned no id';
  assert (select count(*) from public.offer_events where offer_id = v_id) = 1, 'no submitted event';
  assert (select customer_email from public.offers where id = v_id) = 'smoke@example.com', 'email not normalised';

  -- Below 80% is refused by the table itself.
  failed := false;
  begin
    perform public.submit_offer('QM-TEST-2', 'smoke-2', 'Smoke 2', 'used', 10000,
      7999, 'Smoke Test', 'other@example.com', null, 'pickup', null, 'test');
  exception when check_violation then failed := true;
  end;
  assert failed, '79.99% offer was accepted';

  -- Second open offer on the same item from the same address is refused.
  failed := false;
  begin
    perform public.submit_offer('QM-TEST-1', 'smoke-test-item', 'Smoke Test Item', 'used', 10000,
      9000, 'Smoke Test', 'smoke@example.com', null, 'pickup', null, 'test');
  exception when unique_violation then failed := true;
  end;
  assert failed, 'duplicate open offer was accepted';

  -- No direct writes, even for the server key.
  failed := false;
  begin
    update public.offers set status = 'accepted' where id = v_id;
  exception when insufficient_privilege then failed := true;
  end;
  assert failed, 'service_role could update offers directly';

  -- As a signed-in non-staff user: sees nothing, cannot respond.
  reset role;
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"stranger@example.com"}', true);
  set local role authenticated;
  assert (select count(*) from public.offers) = 0, 'non-staff can read offers';
  failed := false;
  begin
    perform public.staff_respond_to_offer(v_id, 'accept');
  exception when insufficient_privilege then failed := true;
  end;
  assert failed, 'non-staff could respond';

  -- As staff: counter, then accept.
  reset role;
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"mr.cometwebsites@gmail.com"}', true);
  set local role authenticated;
  assert (select count(*) from public.offers where id = v_id) = 1, 'staff cannot read offer';

  failed := false;
  begin
    perform public.staff_respond_to_offer(v_id, 'counter', 7000);
  exception when invalid_parameter_value then failed := true;
  end;
  assert failed, 'counter below the offer was accepted';

  v_status := public.staff_respond_to_offer(v_id, 'counter', 9500, 'Can do 95.');
  assert v_status = 'countered', 'counter failed';
  v_status := public.staff_respond_to_offer(v_id, 'accept');
  assert v_status = 'accepted', 'accept failed';
  assert (select count(*) from public.offer_events where offer_id = v_id) = 3, 'expected 3 events';

  failed := false;
  begin
    perform public.staff_respond_to_offer(v_id, 'decline');
  exception when raise_exception then failed := true;
  end;
  assert failed, 'a closed offer changed again';

  -- Events are append-only, whoever asks.
  reset role;
  failed := false;
  begin
    update public.offer_events set note = 'tampered' where offer_id = v_id;
  exception when insufficient_privilege then failed := true;
  end;
  assert failed, 'offer_events was updated';

  raise notice 'offers smoke test: all checks passed';
end;
$$;

rollback;

create or replace function "mcf_mirror_external_action_events"()
returns trigger
language plpgsql
as $$
declare
  external_provider text;
  mirrored_type text;
  mirrored_offset interval;
begin
  if new."event_type" = 'TOOL_REQUESTED' then
    external_provider := nullif(new."payload" ->> 'provider', '');
    if external_provider is null or lower(external_provider) = 'internal' then
      return new;
    end if;

    insert into "mcf_events" (
      "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
      "idempotency_key", "occurred_at"
    ) values (
      'external-action:' || new."id" || ':requested',
      new."mission_id",
      new."phase_id",
      new."agent_id",
      'EXTERNAL_ACTION_REQUESTED',
      new."payload",
      new."idempotency_key" || ':external-requested',
      new."occurred_at" + interval '1 microsecond'
    ) on conflict ("idempotency_key") do nothing;

    insert into "mcf_events" (
      "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
      "idempotency_key", "occurred_at"
    ) values (
      'external-action:' || new."id" || ':allowed',
      new."mission_id",
      new."phase_id",
      new."agent_id",
      'EXTERNAL_ACTION_ALLOWED',
      jsonb_build_object(
        'provider', external_provider,
        'operation', new."payload" ->> 'operation',
        'resource', new."payload" ->> 'resource'
      ),
      new."idempotency_key" || ':external-allowed',
      new."occurred_at" + interval '2 microseconds'
    ) on conflict ("idempotency_key") do nothing;

    return new;
  end if;

  if new."event_type" not in (
    'TOOL_RECEIPT_RECORDED',
    'EVIDENCE_VALIDATED',
    'EVIDENCE_REJECTED'
  ) then
    return new;
  end if;

  select request_event."payload" ->> 'provider'
    into external_provider
    from "mcf_events" request_event
    where request_event."mission_id" = new."mission_id"
      and request_event."phase_id" = new."phase_id"
      and request_event."event_type" = 'TOOL_REQUESTED'
    order by request_event."occurred_at" desc
    limit 1;

  if external_provider is null or lower(external_provider) = 'internal' then
    return new;
  end if;

  mirrored_type := case new."event_type"
    when 'TOOL_RECEIPT_RECORDED' then 'EXTERNAL_ACTION_EXECUTED'
    when 'EVIDENCE_VALIDATED' then 'EXTERNAL_ACTION_EVIDENCE_VALIDATED'
    else 'EXTERNAL_ACTION_FAILED'
  end;
  mirrored_offset := case new."event_type"
    when 'TOOL_RECEIPT_RECORDED' then interval '3 microseconds'
    else interval '4 microseconds'
  end;

  insert into "mcf_events" (
    "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
    "idempotency_key", "occurred_at"
  ) values (
    'external-action:' || new."id" || ':' || lower(mirrored_type),
    new."mission_id",
    new."phase_id",
    new."agent_id",
    mirrored_type,
    new."payload" || jsonb_build_object('provider', external_provider),
    new."idempotency_key" || ':' || lower(mirrored_type),
    new."occurred_at" + mirrored_offset
  ) on conflict ("idempotency_key") do nothing;

  return new;
end;
$$;

drop trigger if exists "mcf_mirror_external_action_events" on "mcf_events";
create trigger "mcf_mirror_external_action_events"
after insert on "mcf_events"
for each row execute function "mcf_mirror_external_action_events"();

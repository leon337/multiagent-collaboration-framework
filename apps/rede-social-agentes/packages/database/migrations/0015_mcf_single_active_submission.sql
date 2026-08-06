create unique index if not exists "mcf_missions_single_pending_child_idx"
  on "mcf_missions" ("parent_mission_id")
  where "parent_mission_id" is not null
    and "return_status" = 'PENDING'
    and "state" <> 'CANCELLED';

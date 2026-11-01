-- Bil-Ghayb schema. Run with `supabase db push` (or paste into the SQL editor).
-- Auth: Supabase anonymous sign-in. No email or phone is ever collected.

create extension if not exists pgcrypto;

-- Contact details are never allowed anywhere (mirrors src/lib/moderation.ts).
create or replace function public.has_contact_info(t text)
returns boolean language sql immutable as $$
  select t is not null and (
    t ~ '[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+'
    or t ~ '(^|[[:space:]])@[^[:space:]]{2,}'
    or t ~ '([0-9٠-٩۰-۹০-৯][[:space:]().\-/]*){6,}'
    or t ~ '\+[[:space:]]*[0-9٠-٩]{2,}'
    or t ~* '(https?://|www\.|whats ?app|wa\.me|telegram|t\.me|viber|snap ?chat|instagram|facebook|messenger|tik ?tok|twitter|linkedin|discord|skype|wechat)'
    or t ~ '(واتس|وتساب|تلغرام|تليجرام|سناب|انستا|انستقرام|فيسبوك|تويتر|تيك توك|ماسنجر)'
    or t ~* '(call me|text me|message me|dm me|contact me|my number|my phone|my email)'
    or t ~ '(كلموني|كلمني|راسلوني|راسلني|تواصلوا|تواصل معي|رقمي|رقم جوالي|ايميلي)'
    or t ~ '(میرا نمبر|رابطہ کریں|مجھ سے رابطہ|شماره من|با من تماس|আমার নম্বর|আমার নাম্বার|যোগাযোগ করুন)'
    or t ~* '(numaram|beni ara|bana ulaş|hubungi saya|nomor saya|nombor saya|appelez-moi|mon numéro|contactez-moi|ruf mich an|meine nummer)'
  );
$$;

-- ───────────────────────── Tables ─────────────────────────

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text check (char_length(first_name) <= 40),
  gender char(1) check (gender in ('f','m')),
  country char(2) not null default 'XX',
  locale text not null default 'en' check (locale in ('en','ar','ur','fa','tr','id','ms','bn','fr','de')),
  tz text not null default 'UTC',
  push_token text,
  notif_morning boolean not null default true,
  notif_special boolean not null default true,
  -- Running totals, so old prayer rows can be deleted (keeps the free database small).
  prayers_made integer not null default 0,
  prayed_for_me integer not null default 0,
  streak integer not null default 0,
  last_prayed_day date,
  created_at timestamptz not null default now()
);

create table public.needs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  kind text not null default 'need' check (kind in ('need','janazah')),
  first_name text check (char_length(first_name) <= 40),
  gender char(1) check (gender in ('f','m')),
  country char(2) not null,
  category text not null check (category in ('health','rizq','marriage','children','exams','grief','guidance','debt','family','other')),
  body text not null check (char_length(body) between 12 and 280),
  lang text not null default 'en' check (lang in ('en','ar','ur','fa','tr','id','ms','bn','fr','de')),
  deceased_name text check (char_length(deceased_name) <= 80),
  status text not null default 'open' check (status in ('open','answered')),
  answered_note text check (char_length(answered_note) <= 280),
  constraint needs_no_contact check (
    not has_contact_info(body) and not has_contact_info(answered_note)
    and (first_name is null or first_name ~ '^[[:alpha:][:space:]''.-]+$')
    and (deceased_name is null or deceased_name ~ '^[[:alpha:][:space:]''.-]+$')
  ),
  answered_at timestamptz,
  prayed_count integer not null default 0,
  report_count integer not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index needs_pool_idx on public.needs (prayed_count, created_at desc)
  where status = 'open' and hidden = false and kind = 'need';
create index needs_answered_idx on public.needs (answered_at desc)
  where status = 'answered' and hidden = false;
create index needs_janazah_idx on public.needs (created_at desc)
  where kind = 'janazah' and hidden = false;
create index needs_author_idx on public.needs (author_id, created_at desc);

-- One person per user per day.
create table public.assignments (
  user_id uuid not null references public.profiles on delete cascade,
  day date not null,
  need_id uuid references public.needs on delete set null,
  prayed_at timestamptz,
  primary key (user_id, day)
);

-- Who prayed for what. Never exposed to clients: only counts and countries leave the DB.
create table public.prayers (
  need_id uuid not null references public.needs on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  country char(2) not null default 'XX',
  created_at timestamptz not null default now(),
  primary key (need_id, user_id)
);
create index prayers_user_idx on public.prayers (user_id, created_at desc);
create index prayers_need_time_idx on public.prayers (need_id, created_at desc);

create table public.pilgrim_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('umrah','hajj')),
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  read_at timestamptz,
  ended boolean not null default false,
  created_at timestamptz not null default now()
);
create index pilgrim_active_idx on public.pilgrim_trips (user_id) where ended = false;

create table public.pilgrim_carries (
  trip_id uuid not null references public.pilgrim_trips on delete cascade,
  need_id uuid not null references public.needs on delete cascade,
  primary key (trip_id, need_id)
);

-- Needs whose authors asked to send them with pilgrims.
create table public.pilgrim_queue (
  need_id uuid primary key references public.needs on delete cascade,
  carried_count integer not null default 0
);

create table public.reports (
  need_id uuid not null references public.needs on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  reason text not null check (reason in ('spam','money','inappropriate','personal_info','other')),
  created_at timestamptz not null default now(),
  primary key (need_id, user_id)
);

-- ───────────────────────── Row level security ─────────────────────────
-- Clients read through views/RPCs below. Direct table access is minimal.

alter table public.profiles enable row level security;
alter table public.needs enable row level security;
alter table public.assignments enable row level security;
alter table public.prayers enable row level security;
alter table public.pilgrim_trips enable row level security;
alter table public.pilgrim_carries enable row level security;
alter table public.pilgrim_queue enable row level security;
alter table public.reports enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Needs are readable when visible. author_id is never selected by the app
-- (and is hidden by the public view), so identity cannot leak.
create policy "read visible needs" on public.needs
  for select using (hidden = false or author_id = auth.uid());
-- Inserts only through the submit-need edge function (service role).
-- Authors may delete their own needs.
create policy "delete own needs" on public.needs
  for delete using (author_id = auth.uid());

create policy "own assignments" on public.assignments
  for select using (user_id = auth.uid());
create policy "own trips" on public.pilgrim_trips
  for select using (user_id = auth.uid());
create policy "own carries" on public.pilgrim_carries
  for select using (exists (select 1 from public.pilgrim_trips t where t.id = trip_id and t.user_id = auth.uid()));
-- prayers, reports, pilgrim_queue: no client policies → only RPCs (security definer) touch them.

-- Public projection without author_id.
create view public.needs_public with (security_invoker = true) as
  select id, kind, first_name, gender, country, category, body, lang, deceased_name, status,
         answered_note, answered_at, prayed_count, created_at,
         (author_id = auth.uid()) as is_mine
  from public.needs;

-- ───────────────────────── Helpers ─────────────────────────

create or replace function public.user_today(uid uuid)
returns date language sql stable as $$
  select (now() at time zone coalesce((select tz from public.profiles where id = uid), 'UTC'))::date;
$$;

-- ───────────────────────── RPCs ─────────────────────────

-- Returns (and lazily creates) today's person.
create or replace function public.get_daily_person()
returns table (day date, need_id uuid, prayed boolean)
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  d date;
  picked uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  d := user_today(uid);

  select a.need_id into picked from assignments a where a.user_id = uid and a.day = d;
  if not found then
    -- Least-prayed open needs first, skipping own needs and ones already prayed for.
    -- A small random window avoids everyone getting the same person.
    -- The reader's language always wins; the random pick happens only inside that group.
    select c.id into picked from (
      select n.id, (n.lang = (select locale from profiles where id = uid)) as same_lang
      from needs n
      where n.kind = 'need' and n.status = 'open' and n.hidden = false
        and n.author_id <> uid
        and n.created_at > now() - interval '60 days'
        and not exists (select 1 from prayers p where p.need_id = n.id and p.user_id = uid)
      order by same_lang desc, n.prayed_count asc, n.created_at desc
      limit 25
    ) c order by c.same_lang desc, random() limit 1;

    insert into assignments (user_id, day, need_id) values (uid, d, picked)
    on conflict do nothing;
  end if;

  return query
    select a.day, a.need_id, a.prayed_at is not null
    from assignments a where a.user_id = uid and a.day = d;
end $$;

create or replace function public.mark_prayed(p_need uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  c char(2);
  inserted int;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select country into c from profiles where id = uid;

  insert into prayers (need_id, user_id, country) values (p_need, uid, coalesce(c, 'XX'))
  on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted > 0 then
    update needs set prayed_count = prayed_count + 1 where id = p_need;
    -- the author's "prayed for me" total
    update profiles set prayed_for_me = prayed_for_me + 1
      where id = (select author_id from needs where id = p_need);
    -- my totals and streak (a missed day resets it)
    update profiles set
      prayers_made = prayers_made + 1,
      streak = case
        when last_prayed_day = user_today(uid) then streak
        when last_prayed_day = user_today(uid) - 1 then streak + 1
        else 1 end,
      last_prayed_day = user_today(uid)
    where id = uid;
  end if;

  update assignments set prayed_at = coalesce(prayed_at, now())
  where user_id = uid and day = user_today(uid) and need_id = p_need;
end $$;

create or replace function public.my_streak()
returns int language sql stable security definer set search_path = public as $$
  -- Today not done yet does not break the streak.
  select case when last_prayed_day >= user_today(auth.uid()) - 1 then streak else 0 end
  from profiles where id = auth.uid();
$$;

create or replace function public.my_stats()
returns json language sql stable security definer set search_path = public as $$
  with mine as (select id from needs where author_id = auth.uid()),
  week as (
    select p.country from prayers p join mine m on m.id = p.need_id
    where p.created_at > now() - interval '7 days'
  )
  select json_build_object(
    'prayedForMeWeek', (select count(*) from week),
    'prayedForMeTotal', (select prayed_for_me from profiles where id = auth.uid()),
    'countriesWeek', coalesce((select json_agg(distinct country) from week), '[]'::json),
    'myPrayersTotal', (select prayers_made from profiles where id = auth.uid()),
    'streak', coalesce(my_streak(), 0)
  );
$$;

create or replace function public.mark_answered(p_need uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if has_contact_info(p_note) then raise exception 'contact details are not allowed'; end if;
  update needs set status = 'answered', answered_note = nullif(trim(p_note), ''), answered_at = now()
  where id = p_need and author_id = auth.uid();
end $$;

create or replace function public.janazah_list()
returns table (id uuid, first_name text, gender char, country char, category text, body text, lang text,
               deceased_name text, prayed_count int, created_at timestamptz, prayed_by_me boolean, is_mine boolean)
language sql stable security definer set search_path = public as $$
  select n.id, n.first_name, n.gender, n.country, n.category, n.body, n.lang, n.deceased_name, n.prayed_count,
         n.created_at,
         exists (select 1 from prayers p where p.need_id = n.id and p.user_id = auth.uid()),
         n.author_id = auth.uid()
  from needs n
  where n.kind = 'janazah' and n.hidden = false and n.created_at > now() - interval '40 days'
  order by n.created_at desc
  limit 100;
$$;

create or replace function public.start_trip(p_kind text, p_starts date, p_ends date)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t uuid;
begin
  update pilgrim_trips set ended = true where user_id = uid and ended = false;
  insert into pilgrim_trips (user_id, kind, starts_on, ends_on) values (uid, p_kind, p_starts, p_ends)
  returning id into t;

  -- Queue first (people who asked specifically), then least-prayed needs. Max 40.
  insert into pilgrim_carries (trip_id, need_id)
  select t, x.id from (
    (select n.id, 0 as pri, q.carried_count as c from pilgrim_queue q join needs n on n.id = q.need_id
       where n.status = 'open' and n.hidden = false and n.author_id <> uid
       order by q.carried_count asc limit 25)
    union all
    (select n.id, 1, n.prayed_count from needs n
       where n.kind = 'need' and n.status = 'open' and n.hidden = false and n.author_id <> uid
       order by n.prayed_count asc limit 40)
  ) x
  group by x.id order by min(x.pri), min(x.c) limit 40
  on conflict do nothing;

  update pilgrim_queue q set carried_count = carried_count + 1
  where q.need_id in (select need_id from pilgrim_carries where trip_id = t);
  return t;
end $$;

create or replace function public.mark_trip_read(p_trip uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  r record;
begin
  if not exists (select 1 from pilgrim_trips where id = p_trip and user_id = uid) then return; end if;
  update pilgrim_trips set read_at = now() where id = p_trip;
  for r in select need_id from pilgrim_carries where trip_id = p_trip loop
    perform mark_prayed(r.need_id);
  end loop;
end $$;

create or replace function public.end_trip(p_trip uuid)
returns void language sql security definer set search_path = public as $$
  update pilgrim_trips set ended = true where id = p_trip and user_id = auth.uid();
$$;

create or replace function public.report_need(p_need uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into reports (need_id, user_id, reason) values (p_need, auth.uid(), p_reason)
  on conflict do nothing;
  if found then
    -- Three independent reports hide a need until a moderator reviews it.
    update needs set report_count = report_count + 1,
                     hidden = (report_count + 1) >= 3
    where id = p_need;
  end if;
  -- Swap today's person if the reporter was assigned this need.
  delete from assignments where user_id = auth.uid() and need_id = p_need and day = user_today(auth.uid());
end $$;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid(); -- cascades to everything
end $$;

-- Lock RPCs to signed-in users.
revoke all on function public.get_daily_person, public.mark_prayed, public.my_stats, public.my_streak, public.mark_answered,
  public.janazah_list, public.start_trip, public.mark_trip_read, public.end_trip, public.report_need,
  public.delete_my_account from public, anon;
grant execute on function public.get_daily_person, public.mark_prayed, public.my_stats, public.my_streak, public.mark_answered,
  public.janazah_list, public.start_trip, public.mark_trip_read, public.end_trip, public.report_need,
  public.delete_my_account to authenticated;
grant select on public.needs_public to authenticated;


-- ───────────────────────── Housekeeping (stay inside the free tier) ─────────────────────────
-- Needs leave the daily pool after 60 days, so prayer rows older than 90 days are no longer
-- needed: totals and streaks live on profiles. Old daily assignments are deleted too.
create or replace function public.cleanup_old_rows()
returns void language sql security definer set search_path = public as $$
  delete from prayers where created_at < now() - interval '90 days';
  delete from assignments where day < current_date - 14;
  delete from pilgrim_trips where ended and created_at < now() - interval '30 days';
$$;
revoke all on function public.cleanup_old_rows from public, anon, authenticated;

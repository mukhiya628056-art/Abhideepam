-- Abhideepam initial schema. Run in Supabase SQL Editor.
-- IMPORTANT: keep service_role/payment secrets server-side. Never expose them in website JS.
create extension if not exists pgcrypto;
create type public.app_role as enum ('student','admin','super_admin');
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', phone text, exam_preference text,
 role public.app_role not null default 'student', disabled boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.site_sections (
 id uuid primary key default gen_random_uuid(), section_key text unique not null,
 title text not null, body jsonb not null default '{}'::jsonb,
 is_published boolean not null default false, sort_order int not null default 0,
 updated_at timestamptz not null default now(), updated_by uuid references auth.users(id)
);
create table public.batches (
 id uuid primary key default gen_random_uuid(), title text not null, description text default '',
 price_paise integer not null default 0 check(price_paise>=0), is_published boolean not null default false,
 starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now()
);
create table public.enrollments (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references auth.users(id) on delete cascade,
 batch_id uuid not null references public.batches(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','active','revoked','expired')),
 starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now(), unique(student_id,batch_id)
);
create table public.tests (
 id uuid primary key default gen_random_uuid(), batch_id uuid references public.batches(id) on delete set null,
 title text not null, description text default '', duration_seconds integer not null default 3600 check(duration_seconds>0),
 is_paid boolean not null default false, is_published boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.test_questions (
 id uuid primary key default gen_random_uuid(), test_id uuid not null references public.tests(id) on delete cascade,
 question text not null, options jsonb not null, correct_option integer not null check(correct_option>=0),
 explanation text default '', marks numeric not null default 1, negative_marks numeric not null default 0, sort_order int not null default 0
);
create table public.test_attempts (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references auth.users(id) on delete cascade,
 test_id uuid not null references public.tests(id) on delete cascade, started_at timestamptz not null default now(),
 submitted_at timestamptz, score numeric, max_score numeric, correct_count int, wrong_count int, skipped_count int,
 status text not null default 'in_progress' check(status in ('in_progress','submitted','evaluated'))
);
create table public.attempt_answers (
 id uuid primary key default gen_random_uuid(), attempt_id uuid not null references public.test_attempts(id) on delete cascade,
 question_id uuid not null references public.test_questions(id) on delete cascade, selected_option integer,
 is_correct boolean, marks_awarded numeric, unique(attempt_id,question_id)
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references auth.users(id) on delete cascade,
 batch_id uuid not null references public.batches(id), provider text not null default 'razorpay',
 provider_order_id text unique, provider_payment_id text unique, amount_paise integer not null check(amount_paise>0),
 currency text not null default 'INR', status text not null default 'created' check(status in ('created','pending','paid','failed','refunded')),
 verified_at timestamptz, created_at timestamptz not null default now()
);
create table public.admin_audit_log (
 id bigint generated always as identity primary key, actor_id uuid references auth.users(id), action text not null,
 target_table text, target_id text, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
-- Automatically create student profile at signup. Role is never taken from signup metadata.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name,phone,exam_preference)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone',new.raw_user_meta_data->>'exam_preference');
 return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','super_admin') and disabled=false); $$;
create or replace function public.is_super_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and disabled=false); $$;
-- RLS everywhere
alter table public.profiles enable row level security;
alter table public.site_sections enable row level security;
alter table public.batches enable row level security;
alter table public.enrollments enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.payments enable row level security;
alter table public.admin_audit_log enable row level security;
create policy "read own profile or admin" on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy "update own basic profile" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid() and role=(select p.role from public.profiles p where p.id=auth.uid()) and disabled=(select p.disabled from public.profiles p where p.id=auth.uid()));
create policy "super admin manages profiles" on public.profiles for all to authenticated using(public.is_super_admin()) with check(public.is_super_admin());
create policy "published sections public read" on public.site_sections for select using(is_published or public.is_admin());
create policy "admins manage sections" on public.site_sections for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "published batches read" on public.batches for select using(is_published or public.is_admin());
create policy "admins manage batches" on public.batches for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "own enrollments or admin" on public.enrollments for select to authenticated using(student_id=auth.uid() or public.is_admin());
create policy "super admin manages enrollments" on public.enrollments for all to authenticated using(public.is_super_admin()) with check(public.is_super_admin());
create policy "published tests read" on public.tests for select using((is_published and (not is_paid or exists(select 1 from public.enrollments e where e.student_id=auth.uid() and e.batch_id=tests.batch_id and e.status='active'))) or public.is_admin());
create policy "admins manage tests" on public.tests for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "questions accessible for permitted tests" on public.test_questions for select to authenticated using(exists(select 1 from public.tests t where t.id=test_id and (public.is_admin() or (t.is_published and (not t.is_paid or exists(select 1 from public.enrollments e where e.student_id=auth.uid() and e.batch_id=t.batch_id and e.status='active')))));
create policy "admins manage questions" on public.test_questions for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "own attempts read" on public.test_attempts for select to authenticated using(student_id=auth.uid() or public.is_admin());
create policy "student starts own attempt" on public.test_attempts for insert to authenticated with check(student_id=auth.uid());
create policy "own attempt update" on public.test_attempts for update to authenticated using(student_id=auth.uid() and status='in_progress') with check(student_id=auth.uid());
create policy "admins manage attempts" on public.test_attempts for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "own answers or admin read" on public.attempt_answers for select to authenticated using(exists(select 1 from public.test_attempts a where a.id=attempt_id and (a.student_id=auth.uid() or public.is_admin())));
create policy "student writes own attempt answers" on public.attempt_answers for insert to authenticated with check(exists(select 1 from public.test_attempts a where a.id=attempt_id and a.student_id=auth.uid() and a.status='in_progress'));
create policy "student updates own attempt answers" on public.attempt_answers for update to authenticated using(exists(select 1 from public.test_attempts a where a.id=attempt_id and a.student_id=auth.uid() and a.status='in_progress')) with check(exists(select 1 from public.test_attempts a where a.id=attempt_id and a.student_id=auth.uid() and a.status='in_progress'));
create policy "admins manage answers" on public.attempt_answers for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "own payments read or admin" on public.payments for select to authenticated using(student_id=auth.uid() or public.is_admin());
create policy "super admin manages payments" on public.payments for all to authenticated using(public.is_super_admin()) with check(public.is_super_admin());
create policy "admins read audit" on public.admin_audit_log for select to authenticated using(public.is_admin());
-- Admins may view payment/enrollment records only if explicitly granted later; mutations are Super Admin only.
-- NOTE: production test delivery must not expose correct_option/explanation before submission. Split answer keys into a server-only table before real paid exams.
-- Do not grant students direct insert/update on payments or enrollments. A verified server webhook must write paid status and activate enrollment.

-- Migration to enforce Free Tier limit at the database level and add RPC helper

-- 1. Create a function to check invoice limit for the authenticated user
create or replace function public.check_invoice_limit()
returns boolean as $$
declare
  user_tier text;
  current_month_str text;
  current_count integer;
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Unauthorized';
  end if;

  -- Get user tier
  select tier into user_tier from public.profiles where id = uid;
  
  -- Get current month format YYYY-MM
  current_month_str := to_char(now(), 'YYYY-MM');
  
  -- Get count
  select invoice_count into current_count 
  from public.usage_limits 
  where user_id = uid and month = current_month_str;
  
  if current_count is null then
    current_count := 0;
  end if;
  
  if user_tier = 'free' and current_count >= 50 then
    return true; -- limit reached
  else
    return false; -- limit not reached
  end if;
end;
$$ language plpgsql security definer;

-- 2. Create trigger function to enforce limit BEFORE INSERT on public.invoices
create or replace function public.enforce_invoice_limit()
returns trigger as $$
declare
  user_tier text;
  current_month_str text;
  current_count integer;
begin
  -- Get user tier
  select tier into user_tier from public.profiles where id = new.user_id;
  
  -- Get current month format YYYY-MM
  current_month_str := to_char(now(), 'YYYY-MM');
  
  -- Get count
  select invoice_count into current_count 
  from public.usage_limits 
  where user_id = new.user_id and month = current_month_str;
  
  if current_count is null then
    current_count := 0;
  end if;
  
  if user_tier = 'free' and current_count >= 50 then
    raise exception 'LIMIT_REACHED: Anda telah mencapai batas 50 invoice gratis bulan ini.';
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create the before insert trigger
drop trigger if exists trigger_enforce_invoice_limit on public.invoices;
create trigger trigger_enforce_invoice_limit
  before insert on public.invoices
  for each row execute procedure public.enforce_invoice_limit();

-- 3. Create trigger function to increment usage AFTER INSERT on public.invoices
create or replace function public.increment_invoice_usage()
returns trigger as $$
declare
  current_month_str text;
begin
  current_month_str := to_char(now(), 'YYYY-MM');
  
  insert into public.usage_limits (user_id, month, invoice_count)
  values (new.user_id, current_month_str, 1)
  on conflict (user_id, month)
  do update set invoice_count = public.usage_limits.invoice_count + 1;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create the after insert trigger
drop trigger if exists trigger_increment_invoice_usage on public.invoices;
create trigger trigger_increment_invoice_usage
  after insert on public.invoices
  for each row execute procedure public.increment_invoice_usage();

-- 4. Update the invoices check constraint to allow 'draft' status
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check check (status in ('draft', 'pending_review', 'unpaid', 'paid', 'confirmed'));

-- 5. Add rincian_item column (jsonb) to public.invoices if not exists
alter table public.invoices add column if not exists rincian_item jsonb default '[]'::jsonb;


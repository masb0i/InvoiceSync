-- Supabase Database Initial Schema for InvoiceSync

-- 1. Create PROFILES Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text,
  tier text check (tier in ('free', 'basic', 'pro', 'enterprise')) default 'free' not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create INVOICES Table
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  image_url text,
  vendor text,
  amount numeric(15, 2),
  category text,
  invoice_date date,
  status text check (status in ('unpaid', 'paid')) default 'unpaid' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create BANK TRANSACTIONS Table
create table public.bank_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric(15, 2) not null,
  description text,
  transaction_date date not null,
  matched_invoice_id uuid references public.invoices on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create USAGE LIMITS Table
create table public.usage_limits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  month varchar(7) not null, -- Format YYYY-MM
  invoice_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_month unique (user_id, month)
);

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.usage_limits enable row level security;

-- Row Level Security Policies

-- Profiles Policies
create policy "Users can view their own profile."
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile."
  on public.profiles for update
  using (auth.uid() = id);

-- Invoices Policies
create policy "Users can view their own invoices."
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "Users can insert their own invoices."
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own invoices."
  on public.invoices for update
  using (auth.uid() = user_id);

create policy "Users can delete their own invoices."
  on public.invoices for delete
  using (auth.uid() = user_id);

-- Bank Transactions Policies
create policy "Users can view their own bank transactions."
  on public.bank_transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bank transactions."
  on public.bank_transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bank transactions."
  on public.bank_transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bank transactions."
  on public.bank_transactions for delete
  using (auth.uid() = user_id);

-- Usage Limits Policies
create policy "Users can view their own usage limits."
  on public.usage_limits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own usage limits."
  on public.usage_limits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own usage limits."
  on public.usage_limits for update
  using (auth.uid() = user_id);

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, business_name, tier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', 'Bisnis Baru'),
    'free'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create Clients table for "Usuarios atendidos"
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table clients enable row level security;

create policy "Enable read access for authenticated users"
on clients for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on clients for insert
to authenticated
with check (true);

create policy "Enable update access for authenticated users"
on clients for update
to authenticated
using (true);

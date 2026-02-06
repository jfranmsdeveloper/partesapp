-- Add client_id to partes table
alter table partes 
add column if not exists client_id uuid references clients(id);

-- Optional: Add index for performance
create index if not exists idx_partes_client_id on partes(client_id);

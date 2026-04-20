create table if not exists donors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  blood_group text not null,
  age integer,
  gender text,
  address text,
  notes text,
  last_donation_date date,
  next_eligible_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists patients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  guardian_phone text not null,
  blood_group text not null,
  age integer,
  gender text,
  address text,
  notes text,
  last_transfusion_date date,
  next_transfusion_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

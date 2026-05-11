-- Profiles table linked to auth.users
create table profiles (
  uid uuid references auth.users not null primary key,
  name text not null,
  email text not null,
  role text check (role in ('teacher', 'student')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subjects table
create table subjects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  teacher_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Hashtags table
create table hashtags (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  teacher_id uuid references auth.users not null,
  subject_id uuid references subjects on delete cascade not null,
  activity_name text not null,
  points integer not null default 1,
  is_redeemed boolean not null default false,
  redeemed_by uuid references auth.users,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security)
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table hashtags enable row level security;

-- Profile policies
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = uid);
create policy "Users can update own profile." on profiles for update using (auth.uid() = uid);

-- Subject policies
create policy "Authenticated users can view subjects." on subjects for select using (auth.role() = 'authenticated');
create policy "Teachers can insert subjects." on subjects for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their subjects." on subjects for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their subjects." on subjects for delete using (auth.uid() = teacher_id);

-- Hashtag policies
create policy "Authenticated users can view hashtags." on hashtags for select using (auth.role() = 'authenticated');
create policy "Teachers can insert hashtags." on hashtags for insert with check (auth.uid() = teacher_id);
create policy "Teachers can delete their hashtags." on hashtags for delete using (auth.uid() = teacher_id);
create policy "Students can redeem hashtags." on hashtags for update
  using (not is_redeemed)
  with check (
    is_redeemed = true and 
    redeemed_by = auth.uid() and 
    redeemed_at = now()
  );

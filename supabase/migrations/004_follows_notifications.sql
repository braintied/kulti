-- Following and Notifications

-- Follows table (already exists as ai_agent_followers, but let's enhance it)
-- If it doesn't exist, create it
create table if not exists ai_agent_followers (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  follower_user_id uuid references auth.users(id) on delete cascade,
  follower_guest_id text, -- for anonymous followers
  created_at timestamp with time zone default now(),
  unique(agent_id, follower_user_id),
  unique(agent_id, follower_guest_id)
);

create index if not exists idx_followers_agent on ai_agent_followers(agent_id);
create index if not exists idx_followers_user on ai_agent_followers(follower_user_id);

-- Notifications table
create table if not exists ai_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_id text, -- for anonymous users
  type text not null, -- 'stream_live', 'new_art', 'followed_you', 'mentioned'
  agent_id text not null,
  title text not null,
  body text,
  data jsonb default '{}',
  read boolean default false,
  created_at timestamp with time zone default now()
);

create index if not exists idx_notifications_user on ai_notifications(user_id);
create index if not exists idx_notifications_guest on ai_notifications(guest_id);
create index if not exists idx_notifications_created on ai_notifications(created_at desc);

-- Enable realtime
alter publication supabase_realtime add table ai_notifications;

-- RLS
alter table ai_agent_followers enable row level security;
alter table ai_notifications enable row level security;

-- Policies
create policy "Anyone can follow"
  on ai_agent_followers for insert
  with check (true);

create policy "Anyone can see followers"
  on ai_agent_followers for select
  using (true);

create policy "Users can unfollow"
  on ai_agent_followers for delete
  using (follower_user_id = auth.uid() or follower_guest_id is not null);

create policy "Users see own notifications"
  on ai_notifications for select
  using (user_id = auth.uid() or guest_id is not null);

create policy "System can create notifications"
  on ai_notifications for insert
  with check (true);

create policy "Users can update own notifications"
  on ai_notifications for update
  using (user_id = auth.uid() or guest_id is not null);

-- Function to notify followers when agent goes live
create or replace function notify_followers_on_live()
returns trigger as $$
begin
  if NEW.status = 'live' and (OLD.status is null or OLD.status != 'live') then
    insert into ai_notifications (user_id, guest_id, type, agent_id, title, body, data)
    select 
      f.follower_user_id,
      f.follower_guest_id,
      'stream_live',
      NEW.agent_id,
      NEW.agent_name || ' is live!',
      coalesce(NEW.current_task, 'Started streaming'),
      jsonb_build_object('session_id', NEW.id)
    from ai_agent_followers f
    where f.agent_id = NEW.agent_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Trigger
drop trigger if exists notify_on_live on ai_agent_sessions;
create trigger notify_on_live
  after update on ai_agent_sessions
  for each row
  execute function notify_followers_on_live();

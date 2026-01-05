-- ==============================================================================
-- 修复：手动为现有表添加 user_id 列 (Safe Migration)
-- 说明：因为表已经存在，直接 CREATE TABLE IF NOT EXISTS 不会修改现有结构。
-- 需要使用 ALTER TABLE 显式添加列。
-- ==============================================================================

-- 1. Music Table
ALTER TABLE public.music 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users DEFAULT auth.uid();

-- 2. Tech Articles Table
ALTER TABLE public.tech_articles 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users DEFAULT auth.uid();

-- 3. Ideas Table
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users DEFAULT auth.uid();

-- 4. Trips Table
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users DEFAULT auth.uid();

-- 5. Sports Records Table
ALTER TABLE public.sports_records 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users DEFAULT auth.uid();

-- 6. Books Table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users DEFAULT auth.uid();

-- 7. Resources Table
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users DEFAULT auth.uid();

-- ==============================================================================
-- 重新应用 RLS 策略 (先删除旧的以防冲突，再创建新的)
-- ==============================================================================

-- 启用 RLS
ALTER TABLE public.music ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 删除所有旧策略 (Drop all existing policies to ensure clean slate)
DROP POLICY IF EXISTS "Public Access Music" ON public.music;
DROP POLICY IF EXISTS "Public Access Tech" ON public.tech_articles;
DROP POLICY IF EXISTS "Public Access Ideas" ON public.ideas;
DROP POLICY IF EXISTS "Public Access Trips" ON public.trips;
DROP POLICY IF EXISTS "Public Access Sports" ON public.sports_records;
DROP POLICY IF EXISTS "Public Access Books" ON public.books;
DROP POLICY IF EXISTS "Public Access Resources" ON public.resources;

DROP POLICY IF EXISTS "Users can view their own music" ON public.music;
DROP POLICY IF EXISTS "Users can insert their own music" ON public.music;
DROP POLICY IF EXISTS "Users can update their own music" ON public.music;
DROP POLICY IF EXISTS "Users can delete their own music" ON public.music;

DROP POLICY IF EXISTS "Users can view their own articles" ON public.tech_articles;
DROP POLICY IF EXISTS "Users can insert their own articles" ON public.tech_articles;
DROP POLICY IF EXISTS "Users can update their own articles" ON public.tech_articles;
DROP POLICY IF EXISTS "Users can delete their own articles" ON public.tech_articles;

DROP POLICY IF EXISTS "Users can view their own ideas" ON public.ideas;
DROP POLICY IF EXISTS "Users can insert their own ideas" ON public.ideas;
DROP POLICY IF EXISTS "Users can update their own ideas" ON public.ideas;
DROP POLICY IF EXISTS "Users can delete their own ideas" ON public.ideas;

DROP POLICY IF EXISTS "Users can view their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can insert their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON public.trips;

DROP POLICY IF EXISTS "Users can view their own sports" ON public.sports_records;
DROP POLICY IF EXISTS "Users can insert their own sports" ON public.sports_records;
DROP POLICY IF EXISTS "Users can update their own sports" ON public.sports_records;
DROP POLICY IF EXISTS "Users can delete their own sports" ON public.sports_records;

DROP POLICY IF EXISTS "Users can view their own books" ON public.books;
DROP POLICY IF EXISTS "Users can insert their own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;

DROP POLICY IF EXISTS "Users can view their own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON public.resources;

-- 创建新的隔离策略 (Re-create isolation policies)

-- 1. Music Policies
create policy "Users can view their own music" on public.music for select using (auth.uid() = user_id);
create policy "Users can insert their own music" on public.music for insert with check (auth.uid() = user_id);
create policy "Users can update their own music" on public.music for update using (auth.uid() = user_id);
create policy "Users can delete their own music" on public.music for delete using (auth.uid() = user_id);

-- 2. Tech Articles Policies
create policy "Users can view their own articles" on public.tech_articles for select using (auth.uid() = user_id);
create policy "Users can insert their own articles" on public.tech_articles for insert with check (auth.uid() = user_id);
create policy "Users can update their own articles" on public.tech_articles for update using (auth.uid() = user_id);
create policy "Users can delete their own articles" on public.tech_articles for delete using (auth.uid() = user_id);

-- 3. Ideas Policies
create policy "Users can view their own ideas" on public.ideas for select using (auth.uid() = user_id);
create policy "Users can insert their own ideas" on public.ideas for insert with check (auth.uid() = user_id);
create policy "Users can update their own ideas" on public.ideas for update using (auth.uid() = user_id);
create policy "Users can delete their own ideas" on public.ideas for delete using (auth.uid() = user_id);

-- 4. Trips Policies
create policy "Users can view their own trips" on public.trips for select using (auth.uid() = user_id);
create policy "Users can insert their own trips" on public.trips for insert with check (auth.uid() = user_id);
create policy "Users can update their own trips" on public.trips for update using (auth.uid() = user_id);
create policy "Users can delete their own trips" on public.trips for delete using (auth.uid() = user_id);

-- 5. Sports Records Policies
create policy "Users can view their own sports" on public.sports_records for select using (auth.uid() = user_id);
create policy "Users can insert their own sports" on public.sports_records for insert with check (auth.uid() = user_id);
create policy "Users can update their own sports" on public.sports_records for update using (auth.uid() = user_id);
create policy "Users can delete their own sports" on public.sports_records for delete using (auth.uid() = user_id);

-- 6. Books Policies
create policy "Users can view their own books" on public.books for select using (auth.uid() = user_id);
create policy "Users can insert their own books" on public.books for insert with check (auth.uid() = user_id);
create policy "Users can update their own books" on public.books for update using (auth.uid() = user_id);
create policy "Users can delete their own books" on public.books for delete using (auth.uid() = user_id);

-- 7. Resources Policies
create policy "Users can view their own resources" on public.resources for select using (auth.uid() = user_id);
create policy "Users can insert their own resources" on public.resources for insert with check (auth.uid() = user_id);
create policy "Users can update their own resources" on public.resources for update using (auth.uid() = user_id);
create policy "Users can delete their own resources" on public.resources for delete using (auth.uid() = user_id);

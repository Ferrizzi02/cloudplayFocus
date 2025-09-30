-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_estimated_minutes INTEGER NOT NULL DEFAULT 0,
  total_spent_minutes INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create subtasks table (AI-generated breakdown)
CREATE TABLE public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL,
  spent_minutes INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subtasks of own tasks"
  ON public.subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert subtasks for own tasks"
  ON public.subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subtasks of own tasks"
  ON public.subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subtasks of own tasks"
  ON public.subtasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Create time_entries table for timer tracking
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries"
  ON public.time_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries"
  ON public.time_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to get friend task statistics
CREATE OR REPLACE FUNCTION public.get_friend_stats(friend_user_id UUID)
RETURNS TABLE (
  total_tasks BIGINT,
  completed_tasks BIGINT,
  completion_percentage INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_tasks,
    COUNT(*) FILTER (WHERE is_completed = true)::BIGINT as completed_tasks,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE is_completed = true)::DECIMAL / COUNT(*)) * 100)::INTEGER
    END as completion_percentage
  FROM public.tasks
  WHERE user_id = friend_user_id;
END;
$$;
-- Create shopping list table
CREATE TABLE IF NOT EXISTS public.shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL,
  unit TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for shopping list
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

-- Create policies for shopping list
CREATE POLICY "Users can view their own shopping list" ON public.shopping_list FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own shopping list items" ON public.shopping_list FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own shopping list items" ON public.shopping_list FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own shopping list items" ON public.shopping_list FOR DELETE USING (auth.uid() = user_id);

-- Create index for shopping list
CREATE INDEX IF NOT EXISTS shopping_list_user_id_idx ON public.shopping_list(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.shopping_list
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

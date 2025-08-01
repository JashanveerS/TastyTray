# TastyTray Database Setup Instructions

Your TastyTray app is now ready, but you need to complete the database setup in Supabase.

## Steps to Complete Setup:

### 1. Go to your Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project (xndknyhedznqxhraomtq)
3. Click on "SQL Editor" in the left sidebar

### 2. Run the Following SQL
Copy and paste this SQL into the editor and click "RUN":

```sql
-- Create shopping list table (missing from your database)
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

-- Ensure the updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.shopping_list;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.shopping_list
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

### 3. Verify Setup
After running the SQL, you should see:
- ✅ Command executed successfully
- No errors in the output

## Your App is Ready!

Once you've completed the database setup:

1. **Start the dev server**: `npm run dev`
2. **Open**: http://localhost:5176/
3. **Test the features**:
   - ✅ **Login/Logout**: Create an account or sign in
   - ✅ **Favorites**: Click the heart ❤️ icon on recipes to add/remove favorites
   - ✅ **Meal Planning**: Click "Plan Meal" button, select date and meal type
   - ✅ **Recipe Viewing**: Click on recipe images or "View Recipe" button

## Features Now Working:
- 🔐 **Authentication**: Login, signup, logout with Supabase
- ❤️ **Favorites**: Persistent favorites stored in Supabase
- 📅 **Meal Planning**: Plan meals for specific dates and meal types
- 🍳 **Recipe Browser**: Browse random recipes from TheMealDB
- 📱 **Responsive Design**: Works on mobile and desktop

## If You Still Have Issues:
1. Check the browser console (F12 → Console) for any error messages
2. Make sure you're logged in before trying to use favorites or meal planning
3. Verify the SQL ran successfully in Supabase SQL Editor

The app is now completely functional with all features working properly!

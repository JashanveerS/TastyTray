# TastyTray 🍽️

A comprehensive meal planning app that helps you discover, organize, and plan your meals with ease. Find recipes, save favorites, plan weekly meals, manage your pantry, and generate shopping lists - all in one place.

## 🌟 Live Demo

**[View Live App](https://your-app-name.vercel.app)** ← *Replace with your Vercel URL*

## ✨ Features

### 🔍 **Recipe Discovery**
- Search thousands of recipes from TheMealDB and Spoonacular APIs
- Advanced filtering by diet, cuisine, cooking time, and ingredients
- View detailed nutrition information and step-by-step instructions
- Beautiful recipe cards with ratings and difficulty levels

### 👤 **User Management**
- Secure authentication with Supabase
- User profiles with personalized preferences
- Session persistence across browser sessions

### ❤️ **Favorites System**
- Save your favorite recipes for quick access
- Easy toggle to add/remove from favorites
- Dedicated favorites page with all saved recipes

### 📅 **Meal Planning**
- Plan meals for specific dates and meal types (breakfast, lunch, dinner)
- Weekly meal plan overview
- Easy recipe assignment to meal slots

### 🥘 **Pantry Management**
- Track ingredients you have at home
- Add/remove pantry items with quantities
- Visual organization of your kitchen inventory

### 🛒 **Smart Shopping Lists**
- Generate shopping lists from your meal plans
- Add custom items to your shopping list
- Check off items as you shop
- Automatically suggest ingredients based on planned meals

### 📱 **Responsive Design**
- Mobile-first responsive design
- Touch-friendly interface on mobile devices
- Seamless experience across desktop, tablet, and mobile

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account (free tier available)
- Optional: Spoonacular API account for enhanced features

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tastytray.git
   cd tastytray
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Supabase Configuration (Required)
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Spoonacular API (Optional but recommended)
   VITE_SPOONACULAR_KEY=your_spoonacular_api_key
   ```

4. **Set up Supabase Database**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema provided in `supabase-schema.sql` in your Supabase SQL editor
   - This creates the necessary tables for users, favorites, meal plans, pantry, and shopping lists

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 API Setup

### Supabase (Required)
1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → API to find your project URL and anon key
4. Add these to your `.env` file

### Spoonacular (Optional)
The app works with TheMealDB (free) alone, but Spoonacular provides enhanced features:

1. Sign up at [Spoonacular API](https://spoonacular.com/food-api)
2. Get your free API key (150 calls/day on free tier)
3. Add to `.env`:
   ```
   VITE_SPOONACULAR_KEY=your_key_here
   ```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **React Router** for client-side routing
- **Lucide React** for beautiful icons

### Backend & Database
- **Supabase** for authentication and database
- **PostgreSQL** (via Supabase) for data storage
- **Row Level Security** for secure data access

### APIs
- **TheMealDB API** for free recipe data
- **Spoonacular API** for enhanced recipe search and nutrition

### Development
- **TypeScript** for better development experience
- **ESLint** for code quality
- **Axios** for API requests

## 📦 Build & Deployment

### Build for production
```bash
npm run build
```

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your GitHub repo to [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy automatically on every push

### Environment Variables for Production
Make sure to add these environment variables in your Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SPOONACULAR_KEY` (optional)

## 🎯 How to Use

1. **Sign Up/Login**: Create an account or sign in to access all features
2. **Discover Recipes**: Use the search bar and filters to find recipes
3. **Save Favorites**: Click the heart icon on recipes you love
4. **Plan Meals**: Click the calendar icon to add recipes to your meal plan
5. **Manage Pantry**: Keep track of ingredients you have at home
6. **Generate Shopping Lists**: Create lists from your meal plans or add custom items
7. **Cook & Enjoy**: Follow the detailed instructions and nutrition info

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [TheMealDB](https://www.themealdb.com/) for free recipe data
- [Spoonacular](https://spoonacular.com/) for enhanced recipe API
- [Supabase](https://supabase.com/) for backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for beautiful icons

Built with ❤️ and lots of coffee ☕

# TastyTray 🍽️

A smart meal planning app that helps you discover recipes based on what you have, what you want, and what fits your goals.

## What it does

- Search thousands of recipes from TheMealDB and Spoonacular
- Filter by diet, cuisine, cooking time, and ingredients
- View detailed nutrition info and step-by-step instructions
- Clean, responsive design that works on all devices

## Getting started

1. Clone this repo
2. Run `npm install`
3. Copy `.env.example` to `.env` (optional - app works without API key)
4. If you want full features, get a free Spoonacular API key and add it to `.env`
5. Run `npm run dev`

## API Setup (optional)

The app works with just TheMealDB (free), but for better search and nutrition data:

1. Go to [Spoonacular](https://spoonacular.com/food-api)
2. Sign up for free (150 calls/day)
3. Add your API key to `.env`:
   ```
   VITE_SPOONACULAR_KEY=your_key_here
   ```

## Tech stack

- React 18 + TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Axios for API calls
- Lucide React for icons

## What's next

- [ ] User profiles and preferences
- [ ] Weekly meal planning
- [ ] Shopping list generation
- [ ] Favorite recipes
- [ ] Recipe recommendations based on your taste

Built with ❤️ and lots of coffee

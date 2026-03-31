# Memepedia

The Wikipedia of Meme Coins. An interactive bubble map that visualizes the history of meme coins, characters, moments, and memes.

## Tech Stack

- **Next.js** (App Router) with TypeScript
- **D3.js** for the zoomable bubble map visualization
- **Tailwind CSS** for styling
- **Supabase** for the database
- **Vercel** for deployment

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/your-username/memepedia.git
   cd memepedia
   npm install
   ```

2. Set up Supabase:
   - Create a project at [supabase.com](https://supabase.com)
   - Run the migration in `supabase/migrations/001_create_entries.sql`
   - Run the seed file in `supabase/seed.sql`

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase URL and anon key.

4. Run locally:
   ```bash
   npm run dev
   ```

## Project Structure

```
app/           Next.js App Router pages
components/    React components (BubbleMap, SearchBar, etc.)
lib/           Supabase client, types, query functions
supabase/      SQL migrations and seed data
```

## How It Works

The homepage renders a full-screen D3 circle packing layout with four category bubbles: Tokens, Characters, Moments, and Memes. Click a category to zoom in and see individual entries. Click an entry to view its detail page.

## Live Site

[memepedia.vercel.app](https://memepedia.vercel.app) *(placeholder)*

## License

MIT

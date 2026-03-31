# Contributing to Memepedia

## Adding New Entries

The easiest way to contribute is by adding new meme coin entries. Each entry lives in the `entries` table and has:

- **Shared fields**: name, slug, headline, description, significance (1-10), tags
- **Type-specific fields**: depends on whether it's a token, character, moment, or meme

To add an entry, create an SQL insert and submit a PR adding it to `supabase/seed.sql` or propose it in an issue.

## Entry Types

| Type | Description | Extra Fields |
|------|-------------|-------------|
| `token` | Meme coins and tokens | chain, ticker, ath_market_cap, launch_date, status, meme_slug |
| `character` | Notable people in the space | known_for, twitter_handle, status |
| `moment` | Defining events | moment_date, impact |
| `meme` | The memes behind the tokens | origin, origin_date, still_active |

## Proposing New Categories

The schema is designed to be extensible. To propose a new category type:

1. Open an issue describing the category and what fields it needs
2. Include 3-5 example entries
3. Explain why it deserves its own bubble on the map

## Code Contributions

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR with a clear description

## Reporting Issues

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce (if applicable)

# ReDrop

A gamified water-conservation website for university students, built by Group 1 of
FDP Water, Module 4, at Ahmedabad University.

**Team:** Dhyey Mody, Milaap Desai, Tanay Patel, Sibangini Gajurel, Anjali Gehlod, Sakshi Jain
**Guidance:** Prof. Ashim Rai and Teaching Associate Nainika Bajaj

## What the site does

- Explains why water shortage matters (the "1,000 drops" view, India and global figures).
- Lets visitors estimate their daily litres with the same rates our Google Sheet uses.
- Sends people to the **Google Form** to log their day.
- Shows the **leaderboard live from Google Sheets** (lowest litres first), with a
  per-person breakdown, and a chart of how people's guesses compare to their calculated use.
- Gives people a reason to come back daily: a rotating tip, a countdown to the Monday
  reset, and a personal "I logged today" week tracker (stored in the visitor's browser).

There is no login and no database. The Google Form collects answers, the Google Sheet does
the maths, and the website reads the sheet directly.

## Files

```
index.html      page structure and copy
css/style.css   all styling (light and dark themes)
js/config.js    form link, sheet id, tab ids, litre rates, offline snapshot
js/app.js       water animation, calculator, leaderboard, charts
```

## Connecting to the sheet

The site reads three tabs through Google's public CSV endpoint:

| Tab          | gid          | Columns used                                  |
|--------------|--------------|-----------------------------------------------|
| Leaderboard  | `1853131906` | Rank, Name, Daily Water                       |
| Calculation  | `737006610`  | Name, Flush, Shower, Brush, Washing, Other, Total |
| Form responses | `801067380` | name, Q1 (guess), Q2, Q9                     |

The spreadsheet must stay shared as **"Anyone with the link can view"**. If you add, rename
or recreate a tab, update its gid in `js/config.js`. If the sheet can't be reached, the site
falls back to the last copy it loaded in that browser, then to the snapshot in `config.js`.

If you change the litre values in the Calculation sheet, update `rates` in `js/config.js`
so the on-site calculator keeps matching.

## Running locally

It's a static site. From this folder:

```
python3 -m http.server 8000
```

then open http://localhost:8000.

## Publishing with GitHub Pages

1. Merge this branch into `main`.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, and save.
4. The site appears at `https://<your-github-username>.github.io/<repo-name>/` after a minute or two.

Any static host (Netlify, Vercel, Cloudflare Pages) works the same way: point it at this folder, no build command.

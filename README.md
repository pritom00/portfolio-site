# Estiaz Nur Pritom, portfolio

A Next.js 14 (App Router, TypeScript) portfolio with a dark-green glass look:

- a 3D "system map" hero (five clickable layers, auto-tour, explode/collapse)
- a 3D project carousel with filters, detail panel and dramatic transitions
- a small 3D dog that chases the cursor (real gaits, paws that don't slide), plus falling snow
- an "Ask about my work" chat that calls Claude (works without a key too)
- real GitHub activity in the hero card

No CSS framework. One stylesheet (`src/app/globals.css`), all words in one file (`src/data/content.ts`).

## 1. Run it

Requires Node 18.18 or newer (Node 20 LTS recommended; the project is tested on Node 20, 22 and 24).

```bash
npm install
npm run dev          # http://localhost:3000
```

Production check:

```bash
npm run build
npm start
```

## 2. Put your real content in (do this first)

Open **`src/data/content.ts`**. Everything on the page comes from this file. Every `[bracketed]` text is a placeholder to replace.

| What | Where in `content.ts` |
| --- | --- |
| email, LinkedIn, CV, availability, "currently building" | `profile` |
| the five layers (frontend, backend, AI, data, devops): description, tools, optional `level` (0-100) | `layers` |
| projects: title, blurb, stack, problem / solution / result, metrics, `demo` and `repo` links | `projects` |
| logos strip, process steps, chat suggestions | `tickerItems`, `processSteps`, `chatSuggestions` |

Tips:

- **Projects** can be 1 to 8. The carousel and the filter buttons adapt (a filter only appears if at least one project uses that category).
- `kind` picks the animated preview on the card: `chat`, `dash`, `graph` or `term`.
- Leave `demo` empty and the "Live demo" button is disabled instead of linking nowhere.
- Put your CV in `public/` (for example `public/cv.pdf`) and set `profile.cv = '/cv.pdf'`.
- Leave a layer's `level` unset and the bar shows `[%]`. Only set it if you want a number visible.

## 3. Turn on the AI chat (optional)

Without a key, the chat answers from simple built-in rules using your `content.ts` data, so it never looks broken.

For real answers:

```bash
cp .env.example .env.local
# put your key in ANTHROPIC_API_KEY
```

- The server route is `src/app/api/chat/route.ts`. The key stays on the server and is never sent to the browser.
- The model is `ANTHROPIC_MODEL` (default `claude-haiku-5-5`). Check <https://docs.claude.com> for current model names and change it if needed.
- The assistant is told to answer **only** from your `content.ts` facts and never invent projects or numbers.
- Safeguards: last 8 messages, 500 characters each, and 20 requests per 10 minutes per IP. The limiter is in memory (per server instance); use Redis or Upstash for a serious deployment.

## 4. GitHub activity card

`src/app/api/github/route.ts` reads your public events (`profile.githubUser`) and caches them for an hour. GitHub allows 60 unauthenticated requests per hour per IP; add `GITHUB_TOKEN` (no scopes needed) to raise that. If GitHub is unreachable the card falls back to a clearly labelled sample pattern.

## 5. Deploy

**Vercel** (simplest): push to GitHub, import the repo at vercel.com, add `ANTHROPIC_API_KEY` (and optionally `GITHUB_TOKEN`) under Environment Variables, deploy.

Any Node host works: `npm run build && npm start`.

## 6. Tests

```bash
npm test
```

| Suite | What it proves |
| --- | --- |
| `test:engine` | dog engine: paws planted at walk, trot and gallop; speed, acceleration and turn limits; stops at a stand-off distance; sits when idle; never clipped by its canvas |
| `test:api` | GitHub route counting against a real captured API response; never claims "live" when GitHub fails |
| `test:ui` | every component in a simulated browser: hero layers, carousel (arrows, keys, dots, filters, tabs), skills, chat flow, nav menu, contact, snow, intro |

`npm run typecheck` runs the TypeScript compiler.

## 7. Troubleshooting

**Windows: `next build` fails with `PageNotFoundError: Cannot find module for page: /api/chat` (or `/api/github`)**

That error means Next could not find the compiled output of a route, which on Windows is almost always a stale or locked `.next` folder, antivirus scanning, or a dev server still holding files. In order:

1. Stop any running `npm run dev` / `npm start` windows.
2. `npm run clean` (this also runs automatically before every `npm run build`).
3. Move the project to a short path outside `Downloads` and `OneDrive`, for example `C:\dev\portfolio-site`, and make sure it is not nested twice (`portfolio-site\portfolio-site`).
4. Add that folder to your antivirus / Windows Defender exclusions while building.
5. Use Node 20 LTS (`nvm use` reads `.nvmrc`). Then `rmdir /s /q node_modules` and `npm ci`.
6. If it still fails, copy the first 30 lines of the build output; the first error is the one that matters.

**The chat answers are generic.** No `ANTHROPIC_API_KEY` is set, so it is using the built-in rules. See section 3.

**The dog does not appear.** It only runs with a mouse on screens 900px or wider, and not when "reduce motion" is on in your OS.

## 8. Project structure

```
src/
  app/
    layout.tsx            fonts, metadata
    page.tsx              page order
    globals.css           the whole design system + animations
    api/chat/route.ts     chat endpoint (Claude + safe fallback)
    api/github/route.ts   GitHub activity endpoint
  components/
    Hero.tsx              headline, rotating words, active-layer card
    SystemMap.tsx         the 3D map (CSS 3D transforms, pointer tilt)
    HeroCards.tsx         skill bars, availability, GitHub heat grid
    Projects.tsx          3D carousel, filters, transitions, detail panel
    ProjectPreview.tsx    animated mini-screens on the cards
    Skills.tsx  ChatDemo.tsx  Process.tsx  Contact.tsx  Ticker.tsx  Nav.tsx  Footer.tsx
    Snow.tsx  BootIntro.tsx  DogCursor.tsx
  data/content.ts         ALL your words and links
  lib/dogReal.ts          the 3D dog (three.js), loaded lazily
  lib/hooks.ts            fit-to-width scaling, reduced-motion hook
scripts/clean.mjs         removes .next before each build
public/icon.svg           favicon
tests/                    engine, API and UI tests
```

## 9. Design and quality notes

- **Responsive.** The hero collapses to one column below 1180px; the 3D map and the project stage scale to fit; the menu becomes a button below 860px.
- **Reduced motion.** With `prefers-reduced-motion`, all animations and transitions are switched off, the intro and snow are removed and the dog is not created.
- **Keyboard.** Every control is a real button or link with a visible focus ring. The project stage works with the arrow keys.
- **Performance.** three.js is imported only when the dog starts, and only on wide screens with a mouse. The pointer-driven effects write straight to CSS variables / DOM transforms from `requestAnimationFrame` instead of re-rendering React. Cards that are not in front pause their preview animations.
- **The dog.** It is skipped on touch devices and screens under 900px. If WebGL is unavailable it quietly does nothing.

## 10. Known limits

- All text is placeholder until you edit `content.ts`. The activity grid and the card previews are real or decorative, but nothing else makes claims about your work.
- The glass effect uses `backdrop-filter`. It degrades to a flat translucent panel in browsers without it.
- `npm run build` in a sandbox without internet shows a Google Fonts warning. The font loads in the browser as normal.

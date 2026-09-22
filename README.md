# GenLayer Livestream Builder

Live at https://pdepablocom.github.io/genlayer-livestream-builder/

Makes GenLayer livestream covers (2880 × 1620) and a looping "starts soon" intro from a form, using the layouts in the Figma files `GL - Live` and `GL - Portal`.

It is a static page. Photos and logos are processed in the browser and never uploaded, so there is no server and nothing to store. Your last session and your saved people are remembered in that browser only.

## Use it

Open `index.html` (double-click works) or the hosted URL.

1. **What are you making**: pick one. Each choice has its own design and remembers what you last typed into it.
   - **GenLayer AMA**: 1 to 6 speakers, the layouts from `GL - Live`.
   - **GenTalks**: 1 to 3 people on the right; a giant "Gen Talks" with the episode as a blue roman numeral underneath on the left.
   - **Builders Weekly Call**: numbered agenda (up to six topics, five with hosts) and up to two hosts.
   - **Agent Tank Livestream**: the Agent Tank look, 1 or 2 speakers.
   - **Partnership**: title plus one or two logos.
   - **Announcement**: one big statement, nothing else.
2. Type the title, date and the rest. Enter forces a line break in the title.
3. **Speakers**: start typing a name to pick someone from the list, or filter by tag. Picking fills the name, role, company and photo. For someone new, type the details and add a photo: it turns black and white on upload. Drag the photo in the preview to reframe it, scroll over it to zoom.
4. **Download PNG** (2880 × 1620) or **1080p**. **Starts-soon intro** previews the animated loop and downloads it as a 12 second, 1920 × 1080 MP4 that loops seamlessly.

Text that doesn't fit steps down a fixed size ladder rather than scaling freely, so spacing stays on the grid.

## Editing the live tool (no developer needed)

The site rebuilds and redeploys itself on every push to `main` (`.github/workflows/deploy.yml`), so anyone with write access to the repo can change it directly on github.com. Ask the repo owner for access first.

- **Add a person**: in the app, fill in the speaker and click **Download person file**. On github.com open the `people` folder, **Add file → Upload files**, drop the file in, and commit. Two to three minutes later they are in everyone's list.
- **Fix a name, role, company or tags**: open `people/<person>.json` on github.com, click the pencil, edit the first lines (the long `photo` line at the end is the picture: leave it), commit.
- **Change a show's default copy**: edit `js/shows.js` the same way.
- **Check a deploy**: the **Actions** tab shows each publish; green means it is live.

Everything else (layouts, fonts, colours) is code and needs a developer: see below.

## People

- **Shared list** (everyone sees it): one file per person in `people/`, added as described above. Tags (`team`, `guest`, anything you like) become the filter chips.
- **My people** (this browser only): **Save to my library** on any speaker. Export and Import move a library between colleagues.

## Change the design

| What | Where |
|---|---|
| A template's positions, sizes, type ladders | `js/templates/<template>.js` |
| Margins and values every template shares | `js/layouts.js` |
| Fonts, colours, line heights, tracking, pills, themes | `artboard.css` |
| The picker entries and their default copy | `js/shows.js` |
| Intro timing and motion | `INTRO` and `INTRO_CUES` in `js/intro.js` |
| The tool's own interface | `app.css` |

All values are artboard pixels, the same numbers you read in Figma.

**Adding a design:** copy `js/templates/partnership.js`, register it with `registerTemplate({ id, name, theme, sections, render })`, add a `<script>` tag in `index.html`, add an entry for it in `js/shows.js`, and put any colours under `.artboard[data-theme="<theme>"]`. Tag elements with `data-intro` (`logo`, `title`, `subtitle`, `portrait`, `caption`, `art`, `date`, `soon`) and the intro animates them with no further work.

## Fonts

F37 Lineca VF (Medium, −3%) and Suisse Int'l / Suisse Int'l Mono, in `fonts/`. They are inlined into `js/fonts.js` as base64 so exports can embed them, including when the page is opened from disk. After replacing a font file run `node tools/build-fonts.js`.

Agent Tank uses Druk Super and Druk Wide Super (trial cuts, cleared for the hackathon material), bundled the same way.

## Deploy

Vercel, connected to this repo: pushing to `main` is the whole deploy, `vercel.json` holds the build settings. (GitHub Pages still publishes too, via `.github/workflows/deploy.yml`.) To run it locally instead: `node tools/build-fonts.js && node tools/build-people.js`, then open `index.html`.

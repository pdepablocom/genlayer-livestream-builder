# GenLayer Livestream Builder

Live at https://pdepablocom.github.io/genlayer-livestream-builder/

Makes GenLayer livestream covers (2880 × 1620) and a looping "starts soon" intro from a form, using the layouts in the Figma files `GL - Live` and `GL - Portal`.

It is a static page. Photos and logos are processed in the browser and never uploaded, so there is no server and nothing to store. Your last session and your saved people are remembered in that browser only.

## Use it

Open `index.html` (double-click works) or the hosted URL.

1. **Show**: pick GenTalks, AMA Agent, Agent Tank Livestream or Builders Weekly Call to fill in the usual template and copy, or stay on Custom. Numbered shows get an episode field that prints as a roman numeral. Each show remembers what you last typed.
2. **Template**: Speakers (1 to 6), Partnership (one or two logos), Announcement (type only), Quote (one speaker and what they said), Agenda (numbered run-of-show, up to six topics), Agent Tank (1 or 2).
3. **Speakers**: start typing a name to pick someone from the list, or filter by tag. Picking fills the name, role, company and photo. For someone new, type the details and add a photo: it turns black and white on upload. Drag the photo in the preview to reframe it, scroll over it to zoom.
4. **Download PNG** (2880 × 1620) or **1080p**. **Starts-soon intro** previews the animated loop and downloads it as a 12 second, 1920 × 1080 MP4 that loops seamlessly.

Text that doesn't fit steps down a fixed size ladder rather than scaling freely, so spacing stays on the grid.

## People

- **Shared list** (everyone sees it): one file per person in `people/`. To add someone, set them up once in the app, click **Download person file**, put the file in `people/`, edit its `tags` if needed (`team`, `guest`, anything you like: tags become the filter chips), then run `node tools/build-people.js` and deploy.
- **My people** (this browser only): **Save to my library** on any speaker. Export and Import move a library between colleagues.

## Change the design

| What | Where |
|---|---|
| A template's positions, sizes, type ladders | `js/templates/<template>.js` |
| Margins and values every template shares | `js/layouts.js` |
| Fonts, colours, line heights, tracking, pills, themes | `artboard.css` |
| Shows and their default copy | `js/shows.js` |
| Intro timing and motion | `INTRO` and `INTRO_CUES` in `js/intro.js` |
| The tool's own interface | `app.css` |

All values are artboard pixels, the same numbers you read in Figma.

**Adding a template:** copy `js/templates/partnership.js`, register it with `registerTemplate({ id, name, theme, sections, render })`, add a `<script>` tag in `index.html`, and put any colours under `.artboard[data-theme="<theme>"]`. Tag elements with `data-intro` (`logo`, `title`, `subtitle`, `portrait`, `caption`, `art`, `date`, `soon`) and the intro animates them with no further work.

## Fonts

F37 Lineca VF (Medium, −3%) and Suisse Int'l / Suisse Int'l Mono, in `fonts/`. They are inlined into `js/fonts.js` as base64 so exports can embed them, including when the page is opened from disk. After replacing a font file run `node tools/build-fonts.js`.

**Agent Tank uses Druk** (Druk Super and Druk Wide Super). Druk is licensed separately and is not bundled: the template uses the copy installed on your computer, and the panel warns you when there isn't one. Anyone making Agent Tank covers needs Druk installed.

## Deploy

Any static host. For GitHub Pages: push this folder as the repo root and enable Pages on `main`. There is no build step beyond the two scripts above.

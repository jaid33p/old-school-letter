# Vintage Letter

A single-page site: the reader sees a sealed envelope, breaks the red wax seal, the envelope opens, and your letter types itself out on aged paper, ending with a handwritten signature and a stamped seal.

## Files

| File | What it is |
|---|---|
| `index.html` | **The only file you edit.** Envelope settings + your letter. |
| `style.css` | Look and feel (colours are at the top if you want to tweak). |
| `script.js` | Animation, typewriter and sound. No edits needed. |

## 1. Add your letter

Open `index.html` and find the block between `▼▼▼ START OF LETTER ▼▼▼` and `▲▲▲ END OF LETTER ▲▲▲`.

- Each paragraph goes in its own `<p> ... </p>`.
- Special lines (delete any you don't want):
  - `<p class="date">` — right-aligned date line
  - `<p class="salutation">` — "My dear …,"
  - `<p class="closing">` — "With all my love,"
  - `<p class="signature">` — written in handwriting and drawn in, not typed
  - `<p class="ps">` — postscript
- `<em>word</em>` underlines a word; `<strong>word</strong>` makes it bolder.
- Characters like `<`, `>` and `&` must be written as `&lt;`, `&gt;`, `&amp;`.

## 2. Envelope settings

Just above the letter, in `#letter-config`:

- `data-seal-initial="J"` — the letter pressed into the wax seal
- `data-envelope-to="For You"` — handwritten name on the envelope
- `data-kicker="You have received a letter"` — line above the envelope
- `data-typing-speed="1"` — `2` = faster, `0.5` = slower
- `data-stamp-seal="true"` — set to `"false"` to skip the small seal at the end

Also update the `<title>` and `og:` tags at the top — that's what shows when the link is pasted into an email or chat.

## 3. Publish on GitHub Pages

1. Create a new repository on GitHub (e.g. `letter`), public.
2. Upload `index.html`, `style.css`, `script.js` (drag and drop in "Add file → Upload files").
3. Go to **Settings → Pages**, set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`, Save.
4. After a minute your letter is live at `https://<your-username>.github.io/letter/`.

To preview locally first: run `python3 -m http.server` in this folder and open http://localhost:8000.

## 4. Send it

Email the link from your own inbox. A simple template:

> Subject: A letter for you ✉
>
> Something arrived for you. Open it somewhere quiet, and turn your sound on:
> https://<your-username>.github.io/letter/

## Good to know

- Sound is **off by default** (browsers block autoplay); the speaker button in the top-right turns on typewriter clicks, the carriage-return bell and paper rustles. All sounds are generated in the browser — no audio files.
- Readers can tap the letter or press **Skip typing** to show everything at once.
- Visitors with "reduce motion" enabled get the letter immediately, without animation.
- Anyone with the link can read the letter, so don't include anything you wouldn't want forwarded.

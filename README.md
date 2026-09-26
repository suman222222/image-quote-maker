# My Studio

A browser-first creative studio from Sumxn Studio. The site is intentionally dependency-free: it uses static HTML, CSS, and JavaScript, with no framework or build step.

## Pages

- `index.html` — welcome page and links to each tool.
- `photo-caption.html` — photo caption and text-card editor.
- `vibe-studio.html` — photo/video preview and mood-guided writing.
- `speaking.html` — English speaking practice with topic filters and slow scrolling.

## Run locally

Serve the project directory with any static web server, for example:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000`. A local server is recommended because it avoids browser restrictions on media previews and local storage.

## Structure

```text
.
├── assets/
│   ├── css/       Page stylesheets
│   └── js/        Page behavior and topic data
├── index.html     Welcome page
├── photo-caption.html
├── speaking.html
└── vibe-studio.html
```

Vibe-based writing uses the visitor's selected mood and description. Media previews stay in the browser; the site does not upload files or claim to analyze their contents.

# sam — coding assistant

A sleek, terminal-styled React coding assistant chat UI. Sam is a sharp, friendly coding assistant powered by Claude — drop in an error, a function, or an architecture question and get a tight, senior-engineer-caliber answer.

![terminal aesthetic](https://img.shields.io/badge/style-terminal-5EEAD4) ![react](https://img.shields.io/badge/react-18-61DAFB) ![vite](https://img.shields.io/badge/vite-5-646CFF) ![license](https://img.shields.io/badge/license-MIT-green)

## Features

- **Terminal aesthetic** — dark theme, JetBrains Mono, a boot sequence, blinking caret, and typing indicator.
- **Markdown-aware rendering** — inline `code` and fenced code blocks with language labels and one-click copy.
- **Suggestion chips** — quick-start prompts on the empty state.
- **Auto-growing textarea** — Enter to send, Shift+Enter for newline.
- **Reduced-motion support** — respects `prefers-reduced-motion`.

## Quick start

```bash
git clone https://github.com/as7111771-create/sam-coding-assistant.git
cd sam-coding-assistant
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## ⚠️ API key / CORS note

The component calls the Anthropic Messages API directly from the browser:

```
https://api.anthropic.com/v1/messages
```

This is fine for local experimentation, but two things to be aware of:

1. **API key** — you need a valid Anthropic API key. The current code does not send an `x-api-key` header, so you'll need to add one (or proxy the request through a backend) before it will return responses. Add the header to the `fetch` call in `SamChat.jsx`:

   ```js
   headers: {
     "Content-Type": "application/json",
     "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
     "anthropic-version": "2023-06-01",
   },
   ```

   Then create a `.env.local`:

   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **CORS** — Anthropic's API does not allow direct browser calls by default. For production, proxy the request through your own backend or serverless function. The direct-fetch approach is intended for local development only.

## Project structure

```
sam-coding-assistant/
├── index.html           # HTML entry
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx         # React mount
│   └── SamChat.jsx      # The full chat component + styles
└── README.md
```

## Customization

- **System prompt** — edit `SYSTEM_PROMPT` at the top of `src/SamChat.jsx`.
- **Suggestions** — edit the `SUGGESTIONS` array.
- **Model** — change `model: "claude-sonnet-4-6"` in the `send()` function.
- **Colors** — tweak the CSS custom properties (`.app` block): `--bg`, `--panel`, `--teal`, `--amber`, etc.

## License

MIT — free to use, modify, and distribute.

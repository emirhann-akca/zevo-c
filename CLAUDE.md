# Zevo Project — Claude Notes

## User shortcuts / aliases

When the user types **`.:`** (period + colon, alone or at the start of a message), interpret it as:

> "Run the **zevo-ad-generator** subagent to produce a new Zevo ad video, applying every accumulated guideline from this and previous sessions."

Behavior:
1. Spawn the `zevo-ad-generator` subagent (defined in `.claude/agents/zevo-ad-generator.md`) via the Agent tool with `subagent_type: "zevo-ad-generator"`.
2. If the user appends additional text after `.:` (e.g. `.: kurucu hikayesi olsun`), pass that text as additional context to the subagent.
3. When the subagent returns, present the result in the user's preferred format (file path, summary, watch instructions).

Do NOT ask for confirmation when `.:` is used — the user has pre-authorized the spawn.

## Project structure

- `tools/ad-generator/` — the autonomous Zevo AI Ad Generator pipeline (Vertex AI + Pexels + ElevenLabs + ffmpeg).
- `brand-assets/videos/` (inside ad-generator) — user-uploaded real Zevo app footage. **GITIGNORED** (some files >100MB).
- `.claude/agents/zevo-ad-generator.md` — subagent definition that wraps the pipeline.

## Hard rules (locked guardrails the user iterated on)

- TR only by default; do NOT render EN unless explicitly asked.
- Caption = voiceover text (NOT short tagline); each word emerald-glows when the TTS engine speaks it. Word-level alignment comes from Microsoft Edge TTS (`msedge-tts`) word-boundary events — free, neural, commercial-use OK. ElevenLabs `/with-timestamps` remains as opt-in fallback if `ELEVENLABS_API_KEY` is set.
- Logo-reveal asset is RESERVED for the auto-outro — never appears mid-video.
- No CTA card (the `zevo. + Hemen Dene` end card was removed at user request).
- Outro: blurred-bg + cleaned source overlay (NOT solid pad bars, NOT drawbox rectangles — user explicitly rejected both).
- No racial/gender filtering of stock-footage casting.
- ffmpeg lives at `C:\Users\serve\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin` and must be added to PATH before running the pipeline (winget didn't propagate it system-wide on this machine). On bash sessions, prepend it explicitly: `export PATH="/c/Users/serve/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin:$PATH"`.

## Pending follow-ups (not done yet)

- [ ] User to rotate the Google Cloud service-account key `5c8f28448a772fee87a29eabdde86c35f3e2518a` (vertex-express@zevo-abd0d) — the new JSON was pasted in chat during 2026-05-24 setup, so it is compromised by the same logic as the previous one.
- [x] ElevenLabs API key concern resolved by switching voiceover provider to Microsoft Edge TTS (no key needed). Old key commented out in `.env`; revoke from ElevenLabs dashboard when convenient.

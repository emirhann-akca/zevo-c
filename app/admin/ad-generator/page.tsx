"use client";

import { useEffect, useRef, useState } from "react";

type Tip = "zevo-template" | "klasik" | "motivasyon" | "kurucu" | "beslenme";

interface RunState {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "killed";
  spec: any;
  startedAt: number;
  endedAt?: number;
  outputDir: string;
  date: string;
  log: string[];
  phase: string;
}

interface ResultsBundle {
  date: string;
  dir: string;
  concepts: any[];
  renders: { conceptId: string; lang: string; videoPath: string }[];
  qc: any[];
  history: any[];
}

interface MemoryBundle {
  lessons: { pattern: string; frequency: number; firstSeen: string; lastSeen: string }[];
  topPerformers: any[];
  worstPerformers: any[];
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function absToRel(abs: string, dir: string): string {
  return abs.replace(dir + "\\", "").replace(dir + "/", "").replace(/\\/g, "/");
}

export default function AdGeneratorAdminPage() {
  const [tip, setTip] = useState<Tip>("klasik");
  const [count, setCount] = useState(1);
  const [langs, setLangs] = useState<("tr" | "en")[]>(["tr"]);
  const [threshold, setThreshold] = useState(60);
  const [maxRetries, setMaxRetries] = useState(0);
  const [skipDiscovery, setSkipDiscovery] = useState(true);
  const [date, setDate] = useState(todayStamp());
  // Preset durations map to concrete seconds when sent to the pipeline.
  // Short = TikTok-pace, Medium = standard Reels, Long = story-driven.
  const [durationPreset, setDurationPreset] = useState<"kisa" | "orta" | "uzun">("orta");
  const targetDuration = durationPreset === "kisa" ? 12 : durationPreset === "uzun" ? 25 : 18;
  const [voiceTr, setVoiceTr] = useState("tr-TR-AhmetNeural");
  const [rateTr, setRateTr] = useState("+25%");
  // Pacing: how tightly shots cut to each other.
  // tempo "snappy" = very fast cuts; "balanced" = default; "relaxed" = breathing room.
  const [tempo, setTempo] = useState<"snappy" | "balanced" | "relaxed">("balanced");

  const [run, setRun] = useState<RunState | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<string>("idle");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ResultsBundle | null>(null);
  const [memory, setMemory] = useState<MemoryBundle | null>(null);
  // All runs the user has produced THIS browser session (cleared on refresh).
  // Each entry carries the run + its QC/render results so we can show scores per attempt.
  const [sessionRuns, setSessionRuns] = useState<{ run: RunState; results: ResultsBundle | null }[]>([]);
  const [dates, setDates] = useState<{ name: string; mp4Count: number }[]>([]);
  const [viewDate, setViewDate] = useState<string>(todayStamp());
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  const logBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logLines]);

  // Load memory + dates on mount
  useEffect(() => { refreshMemory(); refreshDates(); }, []);
  // When viewDate changes, fetch its results
  useEffect(() => { if (viewDate) refreshResults(viewDate); }, [viewDate]);

  // When run completes, fetch results, append to session runs, refresh memory + dates
  useEffect(() => {
    if (run && (run.status === "completed" || run.status === "failed")) {
      setViewDate(run.date);
      refreshMemory();
      refreshDates();
      // Fetch this run's results and stash into session history
      fetch(`/api/ad-generator/results?date=${run.date}`)
        .then((r) => r.json())
        .then((res) => {
          setSessionRuns((prev) => {
            // Replace if a previous entry for this run.id exists (status update), else append
            const without = prev.filter((s) => s.run.id !== run.id);
            return [...without, { run, results: res }];
          });
        })
        .catch(() => {});
    }
  }, [run?.status]);

  async function refreshMemory() {
    try {
      const res = await fetch("/api/ad-generator/memory");
      setMemory(await res.json());
    } catch { /* ignore */ }
  }

  async function refreshDates() {
    try {
      const res = await fetch("/api/ad-generator/dates");
      const j = await res.json();
      setDates(j.dates ?? []);
    } catch { /* ignore */ }
  }

  async function refreshResults(d: string) {
    try {
      const res = await fetch(`/api/ad-generator/results?date=${d}`);
      setResults(await res.json());
    } catch { /* ignore */ }
  }

  async function start() {
    setBusy(true);
    setLogLines([]);
    setPhase("starting...");
    setResults(null);
    const skip: string[] = ["publish"];
    if (skipDiscovery) skip.push("discover", "analyze");
    const pacing = tempo === "snappy"
      ? { interShotGapSec: 0.05, xfadeDurSec: 0.15 }
      : tempo === "relaxed"
      ? { interShotGapSec: 0.35, xfadeDurSec: 0.4 }
      : { interShotGapSec: 0.15, xfadeDurSec: 0.25 }; // balanced
    const body = { tip, count, langs, viralityThreshold: threshold, maxRetries, skip, date, targetDuration, voiceTr, rateTr, ...pacing };

    let res: Response;
    try {
      res = await fetch("/api/ad-generator/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      setLogLines((l) => [...l, `[error] ${(err as Error).message}`]);
      setBusy(false);
      return;
    }
    const json = await res.json();
    const initialRun: RunState = json.run;
    setRun(initialRun);

    const evt = new EventSource(`/api/ad-generator/runs/${initialRun.id}/stream`);
    evt.addEventListener("line", (e: any) => {
      setLogLines((prev) => [...prev, e.data]);
    });
    evt.addEventListener("phase", (e: any) => {
      setPhase(e.data);
    });
    evt.addEventListener("end", async (e: any) => {
      const status = e.data;
      setPhase(status === "completed" ? "Done" : status);
      const r = await fetch(`/api/ad-generator/runs/${initialRun.id}`).then((r) => r.json()).catch(() => null);
      if (r?.run) setRun(r.run);
      setBusy(false);
      evt.close();
    });
    evt.onerror = () => {
      evt.close();
      setBusy(false);
    };
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-emerald-400">Zevo Ad Generator</h1>
            <p className="text-sm text-white/60">Vertical Reels/TikTok ad pipeline — TR voiceover, QC, decision loop</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${
            run?.status === "running" ? "bg-emerald-500/20 text-emerald-300" :
            run?.status === "completed" ? "bg-emerald-500/30 text-emerald-200" :
            run?.status === "failed" ? "bg-red-500/20 text-red-300" :
            "bg-white/10 text-white/60"
          }`}>
            {run?.status ?? "idle"}{phase && phase !== "idle" ? ` • ${phase}` : ""}
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form */}
          <section className="md:col-span-1 bg-white/5 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Üretim parametreleri</h2>

            <label className="block text-sm">
              <span className="text-white/70">Tip</span>
              <select value={tip} onChange={(e) => setTip(e.target.value as Tip)} disabled={busy}
                className="mt-1 w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm">
                <option value="zevo-template">⭐ Şablon — sabit yapı (sorular → hareketler → araya, garanti rotasyon)</option>
                <option value="klasik">Klasik — esnek problem → çözüm yapısı (Gemini yapıyı seçer)</option>
                <option value="motivasyon">Motivasyon — saf lifestyle, minimum UI (Nike/Adidas tarzı)</option>
                <option value="kurucu">Kurucu — kurucu hikayesi / marka anlatısı</option>
                <option value="beslenme">Beslenme — kalori/diyet odaklı (beslenme rakipleri)</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-white/70">Sayı</span>
                <input type="number" value={count} min={1} max={10} onChange={(e) => setCount(Number(e.target.value))} disabled={busy}
                  className="mt-1 w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="text-white/70">Tarih (klasör)</span>
                <input value={date} onChange={(e) => setDate(e.target.value)} disabled={busy}
                  className="mt-1 w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm" />
              </label>
            </div>

            <fieldset className="border border-white/10 rounded p-3">
              <legend className="text-xs text-white/60 px-2">Diller</legend>
              <div className="flex gap-3 text-sm">
                {(["tr", "en"] as const).map((l) => (
                  <label key={l} className="flex items-center gap-1.5">
                    <input type="checkbox" checked={langs.includes(l)} disabled={busy}
                      onChange={(e) => setLangs((cur) => e.target.checked ? [...cur, l] : cur.filter((x) => x !== l))} />
                    {l.toUpperCase()}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-white/70">Virality eşiği</span>
                <input type="number" value={threshold} min={0} max={100} onChange={(e) => setThreshold(Number(e.target.value))} disabled={busy}
                  className="mt-1 w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="text-white/70">Max retry</span>
                <input type="number" value={maxRetries} min={0} max={5} onChange={(e) => setMaxRetries(Number(e.target.value))} disabled={busy}
                  className="mt-1 w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm" />
              </label>
            </div>

            <fieldset className="border border-white/10 rounded p-3 space-y-3">
              <legend className="text-xs text-white/60 px-2">Ses ve süre</legend>

              <label className="block text-sm">
                <span className="text-white/70">TR ses</span>
                <select value={voiceTr} onChange={(e) => setVoiceTr(e.target.value)} disabled={busy}
                  className="mt-1 w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm">
                  <optgroup label="Yerli TR (en doğal aksan)">
                    <option value="tr-TR-AhmetNeural">Ahmet — erkek, standart TR</option>
                    <option value="tr-TR-EmelNeural">Emel — kadın, net</option>
                  </optgroup>
                  <optgroup label="Multilingual erkek (TR konuşur, farklı tını)">
                    <option value="en-US-AndrewMultilingualNeural">Andrew — derin, olgun, güven veren</option>
                    <option value="en-US-BrianMultilingualNeural">Brian — sıcak, sohbet tonu</option>
                    <option value="en-AU-WilliamMultilingualNeural">William — Avustralyalı, enerjik</option>
                    <option value="de-DE-FlorianMultilingualNeural">Florian — Alman, sert ton</option>
                    <option value="it-IT-GiuseppeMultilingualNeural">Giuseppe — İtalyan, dramatik</option>
                    <option value="fr-FR-RemyMultilingualNeural">Remy — Fransız, akıcı</option>
                    <option value="ko-KR-HyunsuMultilingualNeural">Hyunsu — Koreli, genç tını</option>
                  </optgroup>
                </select>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[11px] text-white/40">Önizleme:</span>
                  <audio controls preload="none" className="h-7 flex-1" style={{ filter: "invert(0.85) hue-rotate(180deg)" }}
                    src={`/api/ad-generator/video?path=${encodeURIComponent(`_voice-test/${voiceTr.replace(/[^a-z0-9]/gi, "-")}-0.mp3`)}`} />
                </div>
              </label>

              <label className="block text-sm">
                <span className="text-white/70">Konuşma hızı</span>
                <select value={rateTr} onChange={(e) => setRateTr(e.target.value)} disabled={busy}
                  className="mt-1 w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm">
                  <option value="-10%">Yavaş (−%10)</option>
                  <option value="+0%">Normal</option>
                  <option value="+15%">Hafif hızlı (+%15)</option>
                  <option value="+25%">Hızlı (+%25)</option>
                  <option value="+40%">Çok hızlı (+%40)</option>
                  <option value="+50%">Aşırı hızlı (+%50)</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-white/70">Reklam süresi</span>
                <select value={durationPreset} onChange={(e) => setDurationPreset(e.target.value as any)} disabled={busy}
                  className="mt-1 w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm">
                  <option value="kisa">Kısa (~12s) — TikTok hızlı, tek mesaj</option>
                  <option value="orta">Orta (~18s) — standart Reels ← default</option>
                  <option value="uzun">Uzun (~25s) — hikaye, çok sahne</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-white/70">Sahne tempo</span>
                <select value={tempo} onChange={(e) => setTempo(e.target.value as any)} disabled={busy}
                  className="mt-1 w-full bg-[#0A1628] border border-white/10 rounded px-2 py-1.5 text-sm">
                  <option value="snappy">Hızlı — VO biter bitmez sonraki shot (50ms gap, 150ms crossfade)</option>
                  <option value="balanced">Dengeli — kısa nefes (150ms gap, 250ms crossfade) ← default</option>
                  <option value="relaxed">Sakin — nefes alma süresi (350ms gap, 400ms crossfade)</option>
                </select>
              </label>
            </fieldset>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={skipDiscovery} onChange={(e) => setSkipDiscovery(e.target.checked)} disabled={busy} />
              <span className="text-white/70">Discover/Analyze atla (mevcut analyses.json kullan)</span>
            </label>

            <button onClick={start} disabled={busy || langs.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#0A1628] font-semibold py-2 rounded">
              {busy ? "Üretiliyor…" : "Üret"}
            </button>
          </section>

          {/* Log stream */}
          <section className="md:col-span-2 bg-white/5 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Pipeline akışı</h2>
              <span className="text-xs text-white/50">{logLines.length} satır</span>
            </div>
            <div ref={logBoxRef} className="h-72 overflow-y-auto bg-black/40 rounded p-3 font-mono text-xs space-y-0.5">
              {logLines.length === 0 ? (
                <div className="text-white/40">Henüz log yok — "Üret" basın.</div>
              ) : logLines.map((l, i) => (
                <div key={i} className={
                  l.includes("✓") || l.includes("PASS") ? "text-emerald-300" :
                  l.includes("FAIL") || l.includes("error") || l.includes("Error") ? "text-red-300" :
                  l.includes("WARN") || l.includes("⚠") ? "text-amber-300" :
                  l.startsWith("[") ? "text-sky-300" :
                  "text-white/80"
                }>{l}</div>
              ))}
            </div>
          </section>
        </div>

        {/* Session runs — only ads produced in THIS browser session, newest first */}
        {sessionRuns.length > 0 && (
          <section className="bg-white/5 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-emerald-300 uppercase tracking-wide">⚡ Bu oturumdaki denemeler ({sessionRuns.length})</h2>
              <button onClick={() => setSessionRuns([])} className="text-xs text-white/40 hover:text-white/70">temizle</button>
            </div>
            <p className="text-[11px] text-white/40 mb-3">Sayfayı yenileyene kadar bu listede üretilen tüm reklamlar ve puanları görünür. Tarih sekmesi geçmiş tüm üretimi gösterir; bu sekme sadece son birkaç dakikadaki çalışmanı.</p>
            <div className="space-y-3">
              {[...sessionRuns].reverse().map(({ run: r, results: res }) => {
                const time = new Date(r.startedAt).toLocaleTimeString("tr-TR");
                const renders = res?.renders ?? [];
                return (
                  <div key={r.id} className="bg-black/30 rounded p-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-2">
                      <span className="text-emerald-300 font-mono">{time}</span>
                      <span className="text-white/80">{r.spec?.tip}</span>
                      <span className="text-white/50">×{r.spec?.count}</span>
                      <span className="text-white/50">{r.spec?.langs?.join("/")}</span>
                      <span className="text-white/50">{r.spec?.targetDuration ?? 20}s</span>
                      <span className="text-white/50">eşik {r.spec?.viralityThreshold}</span>
                      <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        r.status === "completed" ? "bg-emerald-500/30 text-emerald-200" :
                        r.status === "failed" ? "bg-red-500/30 text-red-200" :
                        "bg-white/10 text-white/60"
                      }`}>{r.status}</span>
                    </div>
                    {renders.length === 0 ? (
                      <div className="text-xs text-white/40 italic">Çıktı yok</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {renders.map((render: any) => {
                          const qcEntry = res?.qc.find((q: any) => q.videoPath === render.videoPath) ??
                            res?.qc.find((q: any) => q.conceptId === render.conceptId && q.lang === render.lang);
                          const histEntry = res?.history.find((h: any) => h.finalVideoPath === render.videoPath || h.attempts?.some((a: any) => a.videoPath === render.videoPath));
                          const attempts = histEntry?.attempts ?? [{
                            iteration: 0, videoPath: render.videoPath,
                            overallScore: qcEntry?.overallScore ?? 0, verdict: qcEntry?.verdict ?? "",
                          }];
                          const finalIdx = histEntry ? attempts.findIndex((a: any) => a.videoPath === histEntry.finalVideoPath) : 0;
                          const rel = render.videoPath.replace(res!.dir + "\\", "").replace(res!.dir + "/", "").replace(/\\/g, "/");
                          return (
                            <div key={render.conceptId + render.lang} className="bg-black/40 rounded p-2 text-xs">
                              <video controls className="w-full rounded bg-black aspect-[9/16] mb-2" preload="metadata"
                                src={`/api/ad-generator/video?path=${encodeURIComponent(`${res!.date}/${rel}`)}`} />
                              <div className="font-mono text-white/80 text-[11px] truncate">{render.conceptId}</div>
                              {qcEntry && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    qcEntry.verdict === "PASS" ? "bg-emerald-500/30 text-emerald-200" :
                                    qcEntry.verdict === "WARN" ? "bg-amber-500/30 text-amber-200" :
                                    "bg-red-500/30 text-red-200"
                                  }`}>{qcEntry.verdict}</span>
                                  <span className="text-white/70">{qcEntry.overallScore}/100</span>
                                </div>
                              )}
                              {attempts.length > 1 && (
                                <details className="mt-1.5">
                                  <summary className="text-[11px] text-white/50 cursor-pointer hover:text-white/80">{attempts.length} deneme — final: iter {finalIdx}</summary>
                                  <ul className="mt-1 space-y-0.5">
                                    {attempts.map((a: any) => (
                                      <li key={a.iteration} className={`text-[11px] flex items-center justify-between ${a.iteration === finalIdx ? "text-emerald-300 font-semibold" : "text-white/60"}`}>
                                        <span>iter {a.iteration} {a.iteration === finalIdx && "(FINAL)"}</span>
                                        <span>{a.overallScore}/100 · {a.verdict}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </details>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Results — date picker + all-attempts toggle */}
        <section className="bg-white/5 rounded-lg p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Üretilen reklamlar</h2>
            <select value={viewDate} onChange={(e) => setViewDate(e.target.value)}
              className="bg-[#0A1628] border border-white/10 rounded px-2 py-1 text-xs">
              {dates.length === 0 && <option value={viewDate}>{viewDate}</option>}
              {dates.map((d) => (
                <option key={d.name} value={d.name}>{d.name} ({d.mp4Count} video)</option>
              ))}
            </select>
            <label className="ml-auto flex items-center gap-1.5 text-xs text-white/70">
              <input type="checkbox" checked={showAllAttempts} onChange={(e) => setShowAllAttempts(e.target.checked)} />
              Tüm denemeleri göster (iter1, iter2…)
            </label>
          </div>

          {!results || results.renders.length === 0 ? (
            <p className="text-sm text-white/40">Bu tarihte üretilmiş reklam yok.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.renders.map((r) => {
                const finalRel = absToRel(r.videoPath, results.dir);
                // Match by videoPath (more reliable than conceptId — pipelines can rewrite concept ids mid-iterate).
                // Fall back to conceptId+lang only if no videoPath match exists.
                const qcEntry =
                  results.qc.find((q: any) => q.videoPath === r.videoPath) ??
                  results.qc.find((q: any) => q.conceptId === r.conceptId && q.lang === r.lang);
                const histEntry =
                  results.history.find((h: any) => h.finalVideoPath === r.videoPath || h.attempts?.some((a: any) => a.videoPath === r.videoPath)) ??
                  results.history.find((h: any) => h.conceptId === r.conceptId && h.lang === r.lang);
                const attempts: { iteration: number; videoPath: string; overallScore: number; verdict: string }[] =
                  histEntry?.attempts ?? [{ iteration: 0, videoPath: r.videoPath, overallScore: qcEntry?.overallScore ?? 0, verdict: qcEntry?.verdict ?? "" }];
                // When toggle off, only show the final winning attempt
                const visible = showAllAttempts ? attempts : attempts.filter((a) => a.videoPath === (histEntry?.finalVideoPath ?? r.videoPath));
                const finalIdx = histEntry ? attempts.findIndex((a) => a.videoPath === histEntry.finalVideoPath) : 0;

                return (
                  <div key={r.conceptId + r.lang} className="bg-black/30 rounded p-3 space-y-3">
                    <div className="text-xs font-mono text-white/80">
                      {r.conceptId} <span className="text-white/40">[{r.lang}]</span>
                      {histEntry && histEntry.attempts.length > 1 && (
                        <span className="ml-2 text-[10px] text-white/50">
                          {attempts.length} deneme • final: iter {finalIdx} ({histEntry.reason})
                        </span>
                      )}
                    </div>

                    {visible.map((att, i) => {
                      const rel = absToRel(att.videoPath, results.dir);
                      const fullRel = `${results.date}/${rel}`;
                      const isFinal = att.videoPath === (histEntry?.finalVideoPath ?? r.videoPath);
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="relative">
                            <video controls className="w-full rounded bg-black aspect-[9/16]" preload="metadata"
                              src={`/api/ad-generator/video?path=${encodeURIComponent(fullRel)}`} />
                            {showAllAttempts && (
                              <span className={`absolute top-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                isFinal ? "bg-emerald-500 text-[#0A1628]" : "bg-white/30 text-white"
                              }`}>
                                {isFinal ? "FINAL" : `iter ${att.iteration}`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              att.verdict === "PASS" ? "bg-emerald-500/30 text-emerald-200" :
                              att.verdict === "WARN" ? "bg-amber-500/30 text-amber-200" :
                              att.verdict === "FAIL" ? "bg-red-500/30 text-red-200" :
                              "bg-white/10 text-white/50"
                            }`}>{att.verdict || "?"}</span>
                            <span className="text-white/70">{att.overallScore}/100</span>
                            {showAllAttempts && <span className="text-white/40">iter {att.iteration}</span>}
                          </div>
                        </div>
                      );
                    })}

                    {qcEntry && (
                      <div className="text-xs space-y-1 pt-2 border-t border-white/10">
                        {qcEntry.virality && (
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-white/60">
                            <span>Hook: {qcEntry.virality.hookStrength}</span>
                            <span>Hold: {qcEntry.virality.holdPrediction}</span>
                            <span>Caption: {qcEntry.virality.captionHook}</span>
                            <span>Brand: {qcEntry.virality.brandSafety}</span>
                          </div>
                        )}
                        <p className="text-white/60 italic line-clamp-3">{qcEntry.summary}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Memory */}
        {memory && (memory.lessons.length > 0 || memory.topPerformers.length > 0 || memory.worstPerformers?.length > 0) && (
          <section className="bg-white/5 rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-3">📚 Lessons ({memory.lessons.length})</h2>
              <p className="text-[11px] text-white/40 mb-2">Tekrarlanan hatalardan çıkarılan soyut kurallar</p>
              <ul className="space-y-2 text-sm max-h-72 overflow-y-auto pr-2">
                {memory.lessons.map((l, i) => (
                  <li key={i} className="bg-black/30 rounded p-2.5">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-emerald-300 font-mono shrink-0">×{l.frequency}</span>
                      <span className="text-white/80">{l.pattern}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-3">🏆 Top Performers ({memory.topPerformers.length})</h2>
              <p className="text-[11px] text-white/40 mb-2">≥65 puan alan konseptler — tekrarlanacak yapılar</p>
              <ul className="space-y-2 text-sm max-h-72 overflow-y-auto pr-2">
                {memory.topPerformers.length === 0 ? (
                  <li className="text-white/40 text-xs italic">Henüz yüksek skorlu örnek yok</li>
                ) : memory.topPerformers.map((p, i) => (
                  <li key={i} className="bg-black/30 rounded p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white/80 font-mono text-xs">{p.conceptId}</span>
                      <span className="text-emerald-300 text-xs">{p.overallScore}/100</span>
                    </div>
                    <div className="text-white/60 text-xs mt-1 italic">"{p.hookLine}"</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-3">⚠️ Worst Performers ({memory.worstPerformers?.length ?? 0})</h2>
              <p className="text-[11px] text-white/40 mb-2">≤50 puan — tekrarlanmayacak somut yapılar</p>
              <ul className="space-y-2 text-sm max-h-72 overflow-y-auto pr-2">
                {(memory.worstPerformers?.length ?? 0) === 0 ? (
                  <li className="text-white/40 text-xs italic">Henüz çok düşük skorlu örnek yok</li>
                ) : memory.worstPerformers.map((w, i) => (
                  <li key={i} className="bg-black/30 rounded p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white/80 font-mono text-xs">{w.conceptId}</span>
                      <span className="text-red-300 text-xs">{w.overallScore}/100</span>
                    </div>
                    <div className="text-white/60 text-xs mt-1 italic">"{w.hookLine}"</div>
                    <div className="text-amber-300/80 text-[11px] mt-1">↓ {w.primaryFailure}</div>
                    <div className="text-white/50 text-[11px] mt-1 line-clamp-2">{w.failureSummary}</div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

# Zevo AI Ad Generator

Uçtan uca otonom AI ajan: rakip reklam analizinden Meta Ads'e otomatik yüklemeye kadar. WhatsApp videosundaki "Cowork" demo'sunun Zevo'ya uyarlanmış hâli.

## Pipeline

```
1. discover   → Meta Ad Library'den rakip reklamları scrape (Playwright)
2. analyze    → Claude Opus 4.7 ile hook/sahne/CTA analizi
3. concept    → 5 orijinal Zevo konsepti (TR+EN shotlist + voiceover script)
4. assets     → Pexels API'den her sahne için stok video indir
5. render     → ffmpeg ile 9:16 video render + onscreen captions
   + voiceover → ElevenLabs (yoksa macOS `say` fallback)
6. overlay    → Zevo logo (sol üst) + CTA outro kartı (emerald)
7. publish    → Meta Marketing API'ye PAUSED durumda yükle
```

Bonus: `cron-weekly.ts` her Pazartesi tüm pipeline'ı otomatik koşturur.

## Setup

```bash
cd tools/ad-generator
npm install
npx playwright install chromium
cp .env.example .env
# .env içinde VERTEX_PROJECT_ID zorunlu, diğerleri opsiyonel (dry-run/fallback'ler var)
```

**Gereksinimler:**
- `ffmpeg` + `ffprobe` (Homebrew: `brew install ffmpeg`)
- Node 20+
- **Vertex AI:** `VERTEX_PROJECT_ID` + `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON path) — zevo-site backend ile aynı auth pattern. Service account `Vertex AI User` rolüne sahip olmalı.

**Opsiyonel ama önerilen:**
- PEXELS_API_KEY — yoksa video render solid-color placeholder yapar (https://www.pexels.com/api/)
- ELEVENLABS_API_KEY — yoksa macOS `say` ile TR/EN voiceover (kalite düşük ama çalışır)
- META_* — yoksa Phase 7 dry-run yapar (gerçek upload olmaz)

## Çalıştırma

```bash
# Tam pipeline (Phase 1-7)
npm run generate

# Sık kullanılan opsiyonlar
npm run generate -- --count 5 --analyze-limit 15 --dry-run

# Tek faz çalıştır
npm run generate -- --only render
npm run generate -- --only publish --dry-run

# Önceki gün için tekrar render et
npm run generate -- --date 2026-05-17 --only render

# Sadece bir konsepti işle
npm run generate -- --only render --concept-ids ai-form-fix-3am

# Bazı fazları atla (önceden üretilmiş JSON varsa)
npm run generate -- --skip discover,analyze

# Browser'ı görünür modda çalıştır (scrape debug)
npm run generate -- --headful
```

## Haftalık Otomasyon (Cron)

```bash
# crontab -e
0 9 * * 1  cd /Users/emirhanakca/zevo-site/tools/ad-generator && /opt/homebrew/bin/npx tsx src/cron-weekly.ts >> output/cron.log 2>&1
```

Her Pazartesi 09:00'da tam pipeline çalışır. Sonuç `output/cron-history.jsonl`'a yazılır. Meta env'leri set ise reklamlar **PAUSED** olarak yüklenir — sen Ads Manager'da ACTIVE'e geçirip yayına alırsın.

> **Güvenlik notu:** Cron her zaman PAUSED yükler. Ads Manager'da elle aktifleştirmeden hiçbir şey yayına çıkmaz. Bütçeyi sen kontrol edersin.

## Çıktı

```
output/2026-05-17/
├── competitors.json           # Phase 1 raw scrape
├── analyses.json              # Phase 2 Claude analizi
├── concepts.json              # Phase 3 Zevo konseptleri (TR+EN)
├── assets/                    # Phase 4 indirilen Pexels videoları
├── assets-manifest.json
├── renders/
│   ├── ai-form-fix-3am-tr.mp4 # Phase 5+6 final videolar
│   ├── ai-form-fix-3am-en.mp4
│   └── ...
├── renders.json
└── publish-results.json       # Phase 7 Meta upload sonuçları
```

## Bayraklar

| Bayrak | Default | Açıklama |
|---|---|---|
| `--count` | 5 | Üretilecek konsept sayısı |
| `--langs` | tr,en | Render dilleri |
| `--countries` | TR,US | Meta Ad Library bölgeleri |
| `--max-per-keyword` | 6 | Anahtar kelime başına maks rakip reklam |
| `--analyze-limit` | (hepsi) | Claude'a kaç reklam gönderilecek (maliyet kontrolü) |
| `--concept-ids` | (hepsi) | Sadece belirli konseptleri işle |
| `--skip` | (yok) | discover,analyze,concept,assets,render,publish |
| `--only` | (yok) | Sadece tek bir fazı çalıştır |
| `--headful` | false | Scrape browser'ı göster |
| `--dry-run` | false | Meta upload'u simüle et (gerçek yükleme yok) |
| `--date` | bugün | output/{date}/ klasörünü hedefle |

## Meta Marketing API Kurulumu

1. https://developers.facebook.com → yeni app oluştur, "Business" tipinde
2. "Marketing API" ürününü ekle
3. Business Manager → System User oluştur, `ads_management` + `pages_read_engagement` izinleri ver
4. Long-lived access token üret
5. Ads Manager'da boş bir kampanya + ad set oluştur (bütçe + hedef kitle elle ayarlı)
6. `.env`'e id'leri yaz

İlk çalıştırma için Meta business verification gerekebilir (1-5 gün). Onaya kadar `--dry-run` ile çalış.

## Maliyet Tahmini

| Run başına | Tutar |
|---|---|
| Claude (analiz + konsept) | $0.50 - $1.50 |
| Pexels | ücretsiz |
| ElevenLabs (10 video × 30sn) | ~$0.50 |
| Meta Marketing API | ücretsiz |
| **Toplam (haftalık)** | **~$1-2** |

Yayın bütçesi ayrı — onu Ads Manager'da sen belirliyorsun.

## Roadmap

- [x] Phase 1-7 + weekly cron
- [ ] Phase 4b: AI image gen (Replicate/Flux) için telefon mockup overlay
- [ ] Phase 8: Performance feedback loop — yayındaki reklamların ROAS verisini çekip "en iyi 5'in mantığıyla 10 yeni üret" döngüsü
- [ ] `/admin/ads` Next.js önizleme UI

## Notlar

- Meta Ad Library scrape DOM heuristic'ine dayanıyor. Markup değişirse `1-discover.ts` güncellenmeli.
- Pexels stock footage CC0 — ticari kullanım OK.
- ElevenLabs ticari lisans plan tier'ına bağlı, kontrol et.
- AI üretimi cilalı görünen Reels'ler düşük etkileşim alıyor — output'u UGC-feel tutmaya odaklan (shaky cam stock, casual VO preset).

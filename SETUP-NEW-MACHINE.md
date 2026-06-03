# Zevo Ad Generator — Yeni Makine Kurulum Belgesi

Bu belge, projenin **başka bir Windows makineye kopyalanmış** halini çalışır duruma getirmek için Claude Code'a verilecek talimatları içerir.

> **Claude Code'a komut:** "Bu belgeyi oku ve adım adım kurulumu yap. Her adımda bana ne yaptığını söyle, hata olursa dur."

---

## 1. Ön koşullar (sistem seviyesi kurulumlar)

Bu üçü makinede yoksa kurulması lazım:

### 1.1 Node.js (LTS)
```powershell
winget install OpenJS.NodeJS.LTS
```
Doğrula:
```powershell
node --version
npm --version
```

### 1.2 ffmpeg
```powershell
winget install Gyan.FFmpeg
```

**ÖNEMLİ:** winget kurduktan sonra PATH'e otomatik eklenmeyebilir. Şu klasörü PATH'e ekle:
```
C:\Users\<KULLANICI>\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-<VERSION>-full_build\bin
```

Doğrula (yeni PowerShell aç):
```powershell
ffmpeg -version
```

### 1.3 Google Cloud CLI (Vertex AI auth için)
```powershell
winget install Google.CloudSDK
```
Sonra:
```powershell
gcloud auth application-default login
```

---

## 2. Proje bağımlılıkları

Proje klasörüne git:
```powershell
cd <PROJE-KLASORU>\tools\ad-generator
```

`node_modules` zaten kopyalandıysa (Windows→Windows kopyalama), atla. Değilse veya emin değilsen:
```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
```

---

## 3. API key'leri ve env dosyası

`tools/ad-generator/.env` dosyası kopyalandıysa içine bak. **ESKİ KEY'LER COMPROMISED** — yeni key üretip değiştir:

### Gerekli env değişkenleri:
```
GOOGLE_APPLICATION_CREDENTIALS=<service-account-json-path>
GOOGLE_CLOUD_PROJECT=<proje-id>
GOOGLE_CLOUD_LOCATION=us-central1
ELEVENLABS_API_KEY=<yeni-key>
PEXELS_API_KEY=<yeni-key>
```

### Key'leri yenilemek için:
- **Google Cloud service account:** https://console.cloud.google.com/iam-admin/serviceaccounts → eski key'i sil, yeni JSON indir
- **ElevenLabs:** https://elevenlabs.io/app/settings/api-keys → eski key'i revoke et, yeni oluştur
- **Pexels:** https://www.pexels.com/api/ → mevcut key kullanılabilir (compromised değildi)

---

## 4. Brand assets kontrolü

`tools/ad-generator/brand-assets/videos/` klasöründe **gerçek Zevo app footage'ı** olmalı (11 video). Bu klasör `.gitignore`'da olduğu için git'le gelmez ama **sağ tık kopyala ile gelir**. Kontrol et:
```powershell
Get-ChildItem tools\ad-generator\brand-assets\videos
```
11 mp4 dosyası görmelisin. Yoksa eski makineden manuel kopyala (USB/cloud).

---

## 5. CLAUDE.md kurallarını oku

Proje kök dizinindeki `CLAUDE.md` dosyasında **kilitli guardrail'ler** var (TR-only, logo sadece outro, CTA yok, vs.). Bunlara uy.

---

## 6. Test çalıştırması

İlk reklamı üret:
```powershell
cd tools\ad-generator
npm run dev -- --topic "test reklam"
```

veya Claude Code içinde shortcut:
```
.:
```

(`.:` yazınca `zevo-ad-generator` subagent'ı tetiklenir, CLAUDE.md'de tanımlı.)

Çıktı `tools/ad-generator/output/` altına düşer.

---

## 7. Yaygın hatalar

| Hata | Çözüm |
|---|---|
| `ffmpeg: command not found` | PATH'e ekle, PowerShell'i yeniden aç |
| `GOOGLE_APPLICATION_CREDENTIALS` hatası | `.env`'deki path doğru mu, JSON dosyası var mı? |
| `401 Unauthorized` (ElevenLabs) | Key yenile |
| `npm install` Node-gyp hatası | Visual Studio Build Tools kur: `winget install Microsoft.VisualStudio.2022.BuildTools` |
| brand-assets bulunamadı | `tools/ad-generator/brand-assets/videos/` boş, manuel kopyala |

---

## 8. Checklist (kuruluma başlamadan önce ✔)

- [ ] Node.js kuruldu (`node --version` çalışıyor)
- [ ] ffmpeg kuruldu ve PATH'te (`ffmpeg -version` çalışıyor)
- [ ] gcloud kuruldu ve auth yapıldı
- [ ] `npm install` çalıştı
- [ ] `.env` dosyası mevcut ve **yeni** key'lerle dolu
- [ ] `brand-assets/videos/` içinde 11 video var
- [ ] Test üretimi başarılı

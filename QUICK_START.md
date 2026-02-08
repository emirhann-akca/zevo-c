# 🎯 ZEVO Premium - Hızlı Başlangıç Kılavuzu

## 📦 Ne Yaptık?

Apple ve Google seviyesinde **premium bir web sitesi** oluşturduk:

✅ **Modern Tech Stack**
- Next.js 14 + TypeScript
- Tailwind CSS
- Framer Motion (animasyonlar)
- GSAP (scroll efektleri)
- Three.js (3D hazır)

✅ **Premium Animasyonlar**
- Hero'da floating koala
- Feature cards hover glow
- 3D tilt team cards
- Smooth scroll reveals
- Magnetic buttons
- Gradient animations

✅ **6 Ana Section**
1. Hero - Animated gradient + CTA
2. Features - 4 interactive cards
3. Why ZEVO - Sticky scroll + phone mockup
4. About - Timeline + stats
5. Team - 3D tilt cards
6. Footer - Wave separator

---

## 🚀 Kurulum (3 Adım)

### 1️⃣ Projeyi Aç

```bash
cd zevo-premium
```

### 2️⃣ Paketleri Yükle

```bash
npm install
```

veya hızlı kurulum script'i:

```bash
./setup.sh
```

### 3️⃣ Server'ı Başlat

```bash
npm run dev
```

Tarayıcıda: **http://localhost:3000**

---

## 🖼️ Görselleri Ekle (ÖNEMLİ!)

Şu görselleri `public/` klasörüne ekleyin:

```
public/
├── koala.png           👈 Ana maskot
├── team-emirhan.png    👈 Emirhan'ın fotoğrafı
├── team-sefa.png       👈 Sefa'nın fotoğrafı
└── team-server.png     👈 Server'ın fotoğrafı
```

**Not:** Şu an placeholder emoji'ler var. Gerçek fotoğrafları eklediğinizde otomatik güncellenecek.

---

## 🎨 Özelleştirme

### Renkleri Değiştir

`tailwind.config.js` dosyasında:

```javascript
colors: {
  primary: {
    DEFAULT: '#8B5CF6',  // 👈 Ana mor renk
    light: '#A78BFA',
    dark: '#7C3AED',
  }
}
```

### Animasyon Hızını Ayarla

`lib/animations.ts` dosyasında:

```typescript
export const slideUp = {
  transition: { duration: 0.6 }  // 👈 Hızı buradan ayarla
}
```

### İçerikleri Değiştir

Her component kendi dosyasında:
- `components/Hero.tsx` - Ana başlık
- `components/Features.tsx` - Özellikler
- `components/Team.tsx` - Ekip bilgileri

---

## 🎬 Animasyon Özellikleri

### Hero Section
- ✨ Gradient mesh background (15s loop)
- 🐨 Floating koala (3s up/down)
- 📝 Staggered text (0.1s delay)
- 🎯 Magnetic buttons
- ⬇️ Bounce scroll indicator

### Feature Cards
- 🎴 Lift 8px on hover
- 💜 Purple glow shadow
- 🔄 Icon rotation
- 📊 Scroll reveal

### Team Cards
- 🎮 3D tilt effect (mouse follow)
- 🔍 Image zoom 1.05x
- 🌈 Purple gradient overlay
- 🔗 Social icons reveal

### Navigation
- 🌫️ Blur background on scroll
- 📍 Active section indicator
- 📱 Full-screen mobile menu
- 🎨 Smooth transitions

---

## 📱 Responsive

✅ **Mobile** (< 640px)
- Single column
- Simplified animations
- Touch-friendly buttons

✅ **Tablet** (640px - 1024px)
- 2 column grid
- Medium animations

✅ **Desktop** (> 1024px)
- Full animations
- Parallax effects
- 3D transforms

---

## 🔧 Faydalı Komutlar

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

---

## 🎯 Production'a Almak İçin

### 1. Build Al

```bash
npm run build
```

### 2. Vercel'e Deploy (Önerilen)

```bash
npm install -g vercel
vercel --prod
```

veya GitHub'a push yapın, Vercel otomatik deploy eder.

### 3. Manuel Hosting

Build klasörünü (`/.next`) herhangi bir Node.js hosting'e yükleyin.

---

## 🐛 Sorun Giderme

### Port zaten kullanımda
```bash
# Başka bir port kullan
npm run dev -- -p 3001
```

### Animasyonlar yavaş
```bash
# GPU acceleration aktif mi kontrol et
# Chrome DevTools > Performance
```

### Görseller gözükmüyor
```bash
# Public klasörüne doğru mu eklediniz?
ls public/
```

---

## 📚 Daha Fazla Özellik Eklemek İçin

### 3D Koala (Three.js)

1. `components/Koala3D.tsx` oluştur
2. `@react-three/fiber` kullan
3. `Hero.tsx` içine import et

### GSAP Scroll Animations

1. `useEffect` içinde GSAP setup
2. ScrollTrigger kullan
3. Pin ve scrub animasyonları ekle

### Lottie İkonlar

1. Lottie JSON dosyaları ekle
2. `lottie-react` ile render et
3. Feature cards'a entegre et

---

## 💡 Pro İpuçları

1. **Performance için:**
   - `next/image` kullan
   - Lazy loading aktif
   - CSS transforms kullan (left/top değil)

2. **Animasyonlar için:**
   - 60fps hedefle
   - GPU acceleration (translateZ(0))
   - will-change dikkatli kullan

3. **SEO için:**
   - Meta tags ekle
   - Alt text'ler yaz
   - Semantic HTML kullan

---

## 🎉 Sonuç

Artık Apple/Google seviyesinde bir web siteniz var! 🚀

**Yapılacaklar:**
- [ ] Görselleri ekle
- [ ] Social media linklerini güncelle
- [ ] Meta tags'leri özelleştir
- [ ] Analytics ekle (Google Analytics, Vercel Analytics)
- [ ] Contact form ekle (opsiyonel)

**Sorularınız için:**
- README.md dosyasını okuyun
- Code comments'lere bakın
- Her component iyi dokümante edilmiş

---

**Başarılar! 🎨✨**

ZEVO ekibi olarak harika bir site oluşturdunuz!

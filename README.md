# 🚀 ZEVO Premium Website

Apple/Google seviyesinde premium web deneyimi ile ZEVO Spor Asistanı web sitesi.

## ✨ Özellikler

- **Modern Stack**: Next.js 14, TypeScript, Tailwind CSS
- **Premium Animasyonlar**: Framer Motion, GSAP, Three.js
- **Responsive Design**: Tüm cihazlarda mükemmel görünüm
- **Performance**: 60fps smooth animasyonlar
- **SEO Optimized**: Meta tags ve structured data

## 🎨 Tasarım Özellikleri

### Hero Section
- Animated gradient mesh background
- Floating 3D koala mascot
- Staggered text animations
- Magnetic CTA buttons
- Smooth scroll indicator

### Features Section
- 4 interactive feature cards
- Hover lift & glow effects
- Icon animations
- Scroll-triggered reveals

### Why ZEVO Section
- Sticky phone mockup
- Parallax scrolling
- 3 benefit cards
- Floating stats

### About Section
- Split layout design
- Interactive timeline
- Animated statistics
- Mission statement

### Team Section
- 3D tilt effect cards
- Image zoom on hover
- Social links reveal
- Purple border glow

### Footer
- Wave separator
- Quick links
- Social icons
- Animated copyright

## 🚀 Kurulum

### 1. Dependencies Yükle

```bash
npm install
# veya
yarn install
```

### 2. Development Server Başlat

```bash
npm run dev
# veya
yarn dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

### 3. Production Build

```bash
npm run build
npm run start
```

## 📁 Proje Yapısı

```
zevo-premium/
├── app/
│   ├── page.tsx          # Ana sayfa
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global stiller
├── components/
│   ├── Navigation.tsx    # Navbar
│   ├── Hero.tsx          # Hero section
│   ├── Features.tsx      # Özellikler
│   ├── WhyZevo.tsx       # Neden ZEVO
│   ├── About.tsx         # Hakkımızda
│   ├── Team.tsx          # Ekip
│   └── Footer.tsx        # Footer
├── lib/
│   └── animations.ts     # Animation utilities
└── public/
    ├── koala.png         # Koala maskot (eklenecek)
    ├── team-emirhan.png  # Ekip fotoğrafları (eklenecek)
    ├── team-sefa.png
    └── team-server.png
```

## 🖼️ Görsel Asset'ler

Aşağıdaki görselleri `public/` klasörüne ekleyin:

- [ ] `koala.png` - Ana koala maskot görseli
- [ ] `team-emirhan.png` - Emirhan Boran Akça
- [ ] `team-sefa.png` - Hasan Sefa Karakoyunlu
- [ ] `team-server.png` - Hasan Server Kamber

## 🎨 Renk Paleti

```css
--primary-purple: #8B5CF6
--dark-bg: #0F0F1E
--accent-purple: #A78BFA
--text-white: #FFFFFF
--text-gray: #94A3B8
```

## 🔧 Konfigürasyon

### Tailwind Config
Custom colors, animations ve utilities `tailwind.config.js` dosyasında tanımlanmıştır.

### Next.js Config
Image optimization ve experimental features `next.config.js` dosyasında ayarlanmıştır.

## 📱 Responsive Breakpoints

- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`
- Large Desktop: `> 1536px`

## ⚡ Performance

- Tüm animasyonlar GPU-accelerated
- Lazy loading for images
- Code splitting
- Optimized bundle size
- 60fps guarantee

## 🎯 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 TODO

- [ ] Koala 3D modelini Three.js ile entegre et
- [ ] Ekip fotoğraflarını ekle
- [ ] GSAP scroll animations ekle
- [ ] Lottie icon animations ekle
- [ ] Performance optimizations
- [ ] SEO meta tags güncelle
- [ ] Accessibility improvements

## 🤝 Contributing

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

© 2025 ZEVO. Tüm hakları saklıdır.

---

**Geliştirici Notları:**

- Tüm animasyonlar Framer Motion kullanılarak yapılmıştır
- Smooth scroll için CSS scroll-behavior kullanılmıştır
- Glass morphism effect için backdrop-filter kullanılmıştır
- Gradient text için background-clip kullanılmıştır

**İletişim:**
- Website: zevooapp.com
- Email: info@zevooapp.com

---

Made with 💜 by ZEVO Team

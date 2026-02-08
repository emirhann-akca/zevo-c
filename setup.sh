#!/bin/bash

echo "🚀 ZEVO Premium Website - Kurulum Başlıyor..."
echo ""

# 1. Dependencies kontrol
echo "📦 Dependencies kontrol ediliyor..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js bulunamadı. Lütfen Node.js 18+ yükleyin."
    exit 1
fi

echo "✅ Node.js bulundu: $(node -v)"
echo ""

# 2. Package installation
echo "📥 Paketler yükleniyor... (Bu birkaç dakika sürebilir)"
npm install

# 3. Placeholder görseller oluştur
echo ""
echo "🖼️  Placeholder görseller oluşturuluyor..."
mkdir -p public

# Koala placeholder
cat > public/koala-placeholder.txt << EOF
Buraya koala.png dosyasını ekleyin
EOF

# Team placeholders
for name in emirhan sefa server; do
    cat > public/team-${name}-placeholder.txt << EOF
Buraya team-${name}.png dosyasını ekleyin
EOF
done

echo "✅ Placeholder dosyalar oluşturuldu"
echo ""

# 4. Bilgilendirme
echo "✨ Kurulum tamamlandı!"
echo ""
echo "📋 Sonraki Adımlar:"
echo ""
echo "1. Görselleri ekleyin:"
echo "   - public/koala.png"
echo "   - public/team-emirhan.png"
echo "   - public/team-sefa.png"
echo "   - public/team-server.png"
echo ""
echo "2. Development server'ı başlatın:"
echo "   npm run dev"
echo ""
echo "3. Tarayıcıda açın:"
echo "   http://localhost:3000"
echo ""
echo "🎨 Apple/Google seviyesinde premium deneyim hazır!"
echo ""

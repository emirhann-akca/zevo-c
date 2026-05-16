import type { Metadata } from 'next'
import LegalLayout from '@/components/layout/LegalLayout'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'ZEVO uygulaması ve web sitesi için gizlilik politikası, veri toplama ve işleme uygulamaları.',
  alternates: { canonical: '/gizlilik' },
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Gizlilik Politikası" lastUpdated="17 Mayıs 2026">
      <p>
        ZEVO (&quot;biz&quot;, &quot;bizim&quot; veya &quot;ZEVO&quot;) olarak gizliliğinize değer veriyoruz. Bu Gizlilik
        Politikası, ZEVO mobil uygulamasını (iOS &amp; Android) ve <strong>zevooapp.com</strong> web sitesini kullandığınızda
        hangi verileri topladığımızı, nasıl işlediğimizi ve haklarınızı açıklar.
      </p>
      <p>
        Politika; <strong>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)</strong>, <strong>Avrupa Birliği Genel Veri
        Koruma Tüzüğü (GDPR)</strong>, <strong>Apple App Store</strong> ve <strong>Google Play Store</strong> politikalarına
        uygun olarak hazırlanmıştır.
      </p>

      <h2>1. Veri Sorumlusu</h2>
      <p>
        Veri sorumlusu: <strong>ZEVO</strong><br />
        İletişim: <a href="mailto:support@zevooapp.com">support@zevooapp.com</a><br />
        Web: <a href="https://zevooapp.com">zevooapp.com</a>
      </p>

      <h2>2. Topladığımız Veriler</h2>

      <h3>2.1. Hesap &amp; Profil Bilgileri</h3>
      <ul>
        <li><strong>E-posta adresi</strong> — kayıt ve giriş için</li>
        <li><strong>Ad / kullanıcı adı</strong> — profil oluşturmak için</li>
        <li><strong>Telefon numarası</strong> — telefon doğrulamalı giriş için (opsiyonel)</li>
        <li><strong>Doğum tarihi, cinsiyet, boy, kilo</strong> — kişiselleştirilmiş antrenman ve beslenme önerileri için</li>
        <li><strong>Profil fotoğrafı</strong> — sizin yüklemeniz halinde</li>
      </ul>

      <h3>2.2. Sağlık &amp; Spor Verileri</h3>
      <ul>
        <li><strong>Antrenman verileri</strong>: egzersiz tipi, set/tekrar sayısı, süre, kalori</li>
        <li><strong>HealthKit (iOS) / Health Connect (Android)</strong> üzerinden: adım sayısı, kalp atış hızı, yakılan kalori, uyku verisi (yalnızca izin verdiğinizde)</li>
        <li><strong>Koşu/yürüyüş takibi</strong>: mesafe, tempo, rota</li>
        <li><strong>Beslenme kayıtları</strong>: tükettiğiniz yiyecekler, kalori, makro besinler</li>
      </ul>

      <h3>2.3. Konum Verisi</h3>
      <ul>
        <li><strong>Hassas (precise) konum</strong>: yalnızca koşu/yürüyüş takip özelliği aktifken, rotanızı çizmek için</li>
        <li>Arka planda konum: kullanıcı izniyle, sadece aktif antrenman süresince</li>
      </ul>

      <h3>2.4. Medya Verileri</h3>
      <ul>
        <li><strong>Fotoğraf/Video</strong>: profil fotoğrafı, yemek fotoğrafı (yapay zeka ile beslenme tanıma) ve egzersiz formu analizi için</li>
        <li><strong>Ses</strong>: yalnızca egzersiz videosu kaydederken mikrofon erişimi</li>
      </ul>

      <h3>2.5. Cihaz &amp; Teknik Veriler</h3>
      <ul>
        <li>Cihaz modeli, işletim sistemi versiyonu, uygulama sürümü</li>
        <li>Firebase Cloud Messaging (FCM) push bildirim tokenı</li>
        <li>Reklam tanımlayıcıları (IDFA / AAID) — yalnızca izniniz dahilinde (ATT prompt)</li>
        <li>Crash &amp; performans verileri (Firebase Crashlytics)</li>
        <li>Anonimleştirilmiş kullanım analitiği (Firebase Analytics)</li>
      </ul>

      <h3>2.6. Satın Alma &amp; Abonelik</h3>
      <ul>
        <li>Abonelik durumu (ZEVO Premium) — RevenueCat aracılığıyla</li>
        <li>Ödeme bilgileri <strong>doğrudan Apple App Store / Google Play</strong> tarafından işlenir; ZEVO kredi kartı bilgilerinizi <strong>asla</strong> görmez veya saklamaz.</li>
      </ul>

      <h2>3. Verileri Nasıl Kullanırız</h2>
      <ul>
        <li>Uygulamayı çalıştırmak, hesabınızı yönetmek</li>
        <li>Kişiselleştirilmiş antrenman, beslenme ve AI Koç önerileri üretmek</li>
        <li>Performansınızı takip etmek ve istatistik göstermek</li>
        <li>Push bildirim göndermek (hatırlatıcı, arkadaş etkileşimi vb.)</li>
        <li>Uygulamayı geliştirmek, hataları tespit etmek</li>
        <li>Yasal yükümlülükleri yerine getirmek</li>
        <li>Yalnızca açık rızanız ile pazarlama iletişimi</li>
      </ul>

      <h2>4. Üçüncü Taraf Hizmetler</h2>
      <p>Aşağıdaki güvenilir hizmet sağlayıcılarını kullanıyoruz:</p>
      <ul>
        <li><strong>Google Firebase</strong> (Auth, Firestore, Storage, Cloud Functions, Analytics, Crashlytics, FCM)</li>
        <li><strong>Google Cloud Vertex AI</strong> — AI Koç ve görsel tanıma</li>
        <li><strong>RevenueCat</strong> — abonelik yönetimi</li>
        <li><strong>Apple HealthKit / Google Health Connect</strong> — sağlık verisi entegrasyonu</li>
        <li><strong>Google AdMob</strong> — ücretsiz kullanıcılar için reklam (kişiselleştirme yalnızca izinle)</li>
        <li><strong>Apple Sign In / Google Sign In</strong> — sosyal giriş</li>
      </ul>
      <p>
        Bu hizmetlerin her birinin kendi gizlilik politikaları vardır ve verileriniz yalnızca hizmeti sunmak için
        gerekli olduğu ölçüde paylaşılır. Verilerinizi <strong>asla</strong> reklam amaçlı satmayız.
      </p>

      <h2>5. Veri Saklama</h2>
      <ul>
        <li>Hesap aktifken: verileriniz hizmeti sunmak için saklanır</li>
        <li>Hesap silindiğinde: tüm kişisel verileriniz <strong>30 gün içinde</strong> kalıcı olarak silinir</li>
        <li>Yasal yükümlülük gereken veriler (örn. fatura kayıtları): ilgili mevzuatın gerektirdiği süre kadar</li>
      </ul>

      <h2>6. Veri Güvenliği</h2>
      <ul>
        <li>Tüm trafik HTTPS/TLS ile şifrelenir</li>
        <li>Hassas veriler sunucu tarafında şifrelenmiş olarak saklanır</li>
        <li>Firebase Security Rules ile yetkilendirme</li>
        <li>Düzenli güvenlik denetimi</li>
      </ul>

      <h2>7. Çocukların Gizliliği</h2>
      <p>
        ZEVO <strong>13 yaş ve üzeri</strong> kullanıcılar için tasarlanmıştır. 13 yaşın altındaki çocuklardan bilerek
        veri toplamayız. Bir ebeveyn olarak çocuğunuzun bize veri verdiğinden şüpheleniyorsanız
        <a href="mailto:support@zevooapp.com"> support@zevooapp.com</a> üzerinden bizimle iletişime geçin.
      </p>

      <h2>8. Haklarınız (KVKK &amp; GDPR)</h2>
      <p>Her zaman aşağıdaki haklara sahipsiniz:</p>
      <ul>
        <li>Verilerinize erişme</li>
        <li>Düzeltilmesini isteme</li>
        <li>Silinmesini isteme (&quot;unutulma hakkı&quot;)</li>
        <li>İşlemeye itiraz etme</li>
        <li>Veri taşınabilirliği</li>
        <li>Açık rızanızı geri çekme</li>
        <li>KVKK için Kişisel Verileri Koruma Kurulu&apos;na şikâyette bulunma</li>
      </ul>
      <p>
        Bu hakları kullanmak için: uygulama içi <strong>Ayarlar → Hesap → Hesabımı Sil</strong> seçeneğini kullanabilir
        veya <a href="mailto:support@zevooapp.com">support@zevooapp.com</a> adresine yazabilirsiniz. Detaylı silme talimatı için
        bkz. <a href="/hesap-silme">Hesap Silme</a>.
      </p>

      <h2>9. Uluslararası Veri Transferi</h2>
      <p>
        Verileriniz Google Cloud altyapısında işlenir ve AB / ABD bölgelerinde saklanabilir. Tüm transferler GDPR uyumlu
        standart sözleşme maddeleri çerçevesinde gerçekleşir.
      </p>

      <h2>10. Politika Güncellemeleri</h2>
      <p>
        Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişikliklerde uygulama içi bildirim veya e-posta ile sizi
        bilgilendiririz. Güncel sürüm her zaman bu sayfada yayınlanır.
      </p>

      <h2>11. İletişim</h2>
      <p>
        Gizlilikle ilgili her türlü soru, talep veya şikâyet için:
        <br />
        E-posta: <a href="mailto:support@zevooapp.com">support@zevooapp.com</a>
      </p>
    </LegalLayout>
  )
}

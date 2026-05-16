import type { Metadata } from 'next'
import LegalLayout from '@/components/layout/LegalLayout'

export const metadata: Metadata = {
  title: 'Hesap Silme',
  description: 'ZEVO hesabınızı ve verilerinizi nasıl silebileceğinizi açıklayan resmi talimat sayfası.',
  alternates: { canonical: '/hesap-silme' },
}

export default function AccountDeletionPage() {
  return (
    <LegalLayout title="Hesap & Veri Silme" lastUpdated="17 Mayıs 2026">
      <p>
        Bu sayfa, ZEVO hesabınızı ve hesabınızla ilişkili tüm verileri nasıl silebileceğinizi açıklar.
        Google Play ve Apple App Store politikalarına uygun olarak hazırlanmıştır.
      </p>

      <h2>1. Uygulama İçinden Silme (Önerilen)</h2>
      <p>En hızlı yöntem ZEVO uygulaması üzerinden silmektir:</p>
      <ul>
        <li>ZEVO uygulamasını açın</li>
        <li>Sağ alttaki <strong>Profil</strong> sekmesine gidin</li>
        <li><strong>Ayarlar</strong> (dişli ikonu) → <strong>Hesap</strong></li>
        <li>Sayfanın altındaki <strong>&quot;Hesabımı Sil&quot;</strong> butonuna basın</li>
        <li>Şifrenizi girerek onaylayın</li>
        <li>Onay e-postasını takip edin</li>
      </ul>

      <h2>2. E-posta ile Silme Talebi</h2>
      <p>Uygulamaya erişiminiz yoksa veya silme işleminde sorun yaşıyorsanız:</p>
      <ul>
        <li>
          <strong>Alıcı:</strong> <a href="mailto:support@zevooapp.com?subject=Hesap%20Silme%20Talebi">support@zevooapp.com</a>
        </li>
        <li><strong>Konu:</strong> Hesap Silme Talebi</li>
        <li>
          <strong>İçerik:</strong> Hesabınızla ilişkili e-posta adresinizi, varsa kullanıcı adınızı ve doğrulama amaçlı son
          giriş tarihinizi belirtin.
        </li>
      </ul>
      <p>Talebiniz <strong>72 saat içinde</strong> işleme alınır ve onay e-postası gönderilir.</p>

      <h2>3. Silinecek Veriler</h2>
      <p>Hesap silme talebi onaylandığında aşağıdaki tüm veriler kalıcı olarak silinir:</p>
      <ul>
        <li>Hesap bilgileri (e-posta, ad, telefon)</li>
        <li>Profil verileri (boy, kilo, doğum tarihi, fotoğraf)</li>
        <li>Antrenman geçmişi ve istatistikler</li>
        <li>Beslenme kayıtları ve yemek fotoğrafları</li>
        <li>Koşu/yürüyüş rotaları ve konum kayıtları</li>
        <li>AI Koç sohbet geçmişi</li>
        <li>Sosyal etkileşimler (Squads, arkadaşlık, mesajlar)</li>
        <li>Push bildirim tokenları</li>
        <li>Kullanım analitiği (anonimleştirilmiş veriler de dahil)</li>
      </ul>

      <h2>4. Saklanan Veriler &amp; Saklama Süreleri</h2>
      <p>Yasal yükümlülükler nedeniyle sınırlı veriler saklanmaya devam edebilir:</p>
      <ul>
        <li>
          <strong>Fatura / abonelik kayıtları:</strong> Vergi ve muhasebe mevzuatı gereği <strong>10 yıl</strong>
          (Türk Ticaret Kanunu)
        </li>
        <li>
          <strong>Yasal süreç ve güvenlik kayıtları:</strong> Aktif yasal süreç bulunması halinde süreç sonuna kadar
        </li>
      </ul>
      <p>Bu veriler hesabınızla ilişkilendirilmez ve sadece yasal zorunluluk dahilinde tutulur.</p>

      <h2>5. Silme Süresi</h2>
      <ul>
        <li>Hesabınız <strong>derhal</strong> devre dışı bırakılır (giriş yapılamaz)</li>
        <li>Tüm kişisel veriler <strong>30 gün içinde</strong> kalıcı olarak sistemden silinir</li>
        <li>Yedeklerden silinme: <strong>90 gün içinde</strong> tamamlanır</li>
      </ul>

      <h2>6. Aboneliği İptal Etme (Önemli)</h2>
      <p>
        Hesabınızı silmek, otomatik yenilenen aboneliğinizi <strong>otomatik olarak iptal etmez</strong>. Premium
        aboneliğiniz varsa önce ilgili mağazadan iptal etmelisiniz:
      </p>
      <ul>
        <li>
          <strong>iOS:</strong> Ayarlar → Apple ID → Abonelikler → ZEVO → İptal Et
        </li>
        <li>
          <strong>Android:</strong> Google Play → Profil → Ödemeler ve abonelikler → Abonelikler → ZEVO → İptal Et
        </li>
      </ul>

      <h2>7. Geri Alma Mümkün mü?</h2>
      <p>
        Silme talebinden sonraki <strong>14 gün içinde</strong> aynı e-posta adresinden bize yazarsanız hesabınız
        geri yüklenebilir. 14 günden sonra silme işlemi <strong>geri alınamaz</strong>.
      </p>

      <h2>8. Sorularınız</h2>
      <p>
        Silme süreciyle ilgili herhangi bir sorunuz için:
        <br />
        <a href="mailto:support@zevooapp.com">support@zevooapp.com</a>
      </p>
    </LegalLayout>
  )
}

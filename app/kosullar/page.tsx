import type { Metadata } from 'next'
import LegalLayout from '@/components/layout/LegalLayout'

export const metadata: Metadata = {
  title: 'Kullanım Şartları',
  description: 'ZEVO uygulaması ve web sitesi için kullanım şartları ve sorumluluk reddi.',
  alternates: { canonical: '/kosullar' },
}

export default function TermsPage() {
  return (
    <LegalLayout title="Kullanım Şartları" lastUpdated="17 Mayıs 2026">
      <p>
        ZEVO uygulamasını ve <strong>zevooapp.com</strong> web sitesini kullanarak aşağıdaki şartları kabul etmiş
        sayılırsınız. Lütfen dikkatlice okuyun.
      </p>

      <h2>1. Hizmet Tanımı</h2>
      <p>
        ZEVO; yapay zekâ destekli kişisel antrenör, hareket analizi, beslenme takibi ve sosyal fitness deneyimi sunan bir
        mobil uygulamadır. Hizmet sürekli geliştirilmekte olup özelliklerde değişiklik yapma hakkımız saklıdır.
      </p>

      <h2>2. Hesap Açma &amp; Yaş Sınırı</h2>
      <ul>
        <li>Hizmeti kullanmak için <strong>en az 13 yaşında</strong> olmalısınız.</li>
        <li>13–18 yaş aralığındaysanız ebeveyn/vasi onayı gereklidir.</li>
        <li>Hesap bilgilerinizin gizliliğinden ve hesabınız altında gerçekleşen tüm aktivitelerden siz sorumlusunuz.</li>
        <li>Sahte bilgi vermek, başka birinin hesabını kullanmak yasaktır.</li>
      </ul>

      <h2>3. Kabul Edilebilir Kullanım</h2>
      <p>Aşağıdakileri yapmamayı kabul edersiniz:</p>
      <ul>
        <li>Yasa dışı, zararlı, taciz edici veya nefret içerikli içerik paylaşmak</li>
        <li>Başkalarının fikri mülkiyet haklarını ihlal etmek</li>
        <li>Uygulamayı tersine mühendislik, kırma veya kötüye kullanma girişimi</li>
        <li>Otomatik araç / bot ile hizmeti suistimal etmek</li>
        <li>Spam veya istenmeyen ticari iletişim göndermek</li>
        <li>Diğer kullanıcıların hesaplarına izinsiz erişmeye çalışmak</li>
      </ul>
      <p>Bu kuralları ihlal eden hesaplar uyarı olmaksızın askıya alınabilir veya silinebilir.</p>

      <h2>4. Sağlık &amp; Tıbbi Sorumluluk Reddi</h2>
      <p>
        <strong>ZEVO bir tıbbi cihaz veya tıbbi tavsiye kaynağı değildir.</strong> Uygulamada sunulan antrenman, beslenme
        ve sağlık önerileri bilgilendirme amaçlıdır ve <strong>hekim, diyetisyen veya lisanslı bir spor uzmanı tavsiyesinin
        yerini tutmaz</strong>.
      </p>
      <ul>
        <li>Herhangi bir egzersiz programına başlamadan önce doktorunuza danışın.</li>
        <li>Egzersiz sırasında baş dönmesi, göğüs ağrısı veya nefes darlığı hissederseniz <strong>derhal durun</strong>.</li>
        <li>Mevcut bir sağlık sorununuz, hamilelik veya kronik hastalığınız varsa kullanım öncesi hekime danışmak zorunludur.</li>
        <li>ZEVO&apos;nun önerdiği programları uygulamanız sonucu doğacak yaralanma veya sağlık sorunlarından ZEVO sorumlu değildir.</li>
      </ul>

      <h2>5. Abonelik &amp; Ödeme (ZEVO Premium)</h2>
      <ul>
        <li>Premium üyelik <strong>haftalık, aylık veya yıllık</strong> abonelik olarak sunulur.</li>
        <li>Ödeme; Apple App Store veya Google Play hesabınızdan tahsil edilir.</li>
        <li>Aboneliğiniz, mevcut dönem sona ermeden en az 24 saat önce iptal edilmediği sürece <strong>otomatik yenilenir</strong>.</li>
        <li>Yenileme ücreti, mevcut dönemin son 24 saati içinde tahsil edilir.</li>
        <li>Aboneliği yönetmek/iptal etmek için: <strong>Apple ID Ayarları → Abonelikler</strong> veya
          <strong> Google Play → Abonelikler</strong>.</li>
        <li>İade talepleri ilgili mağazanın iade politikasına tabidir.</li>
      </ul>

      <h2>6. Kullanıcı İçeriği</h2>
      <p>
        Uygulamaya yüklediğiniz fotoğraf, video, antrenman kaydı vb. içeriklerin sahibi sizsiniz. ZEVO&apos;ya yalnızca
        hizmeti sunmak (depolamak, göstermek, AI analizi için işlemek) amacıyla dünya çapında, telifsiz, sınırlı bir lisans
        vermiş olursunuz. İçerik hukuka aykırı veya başkalarının haklarını ihlal ediyorsa kaldırma hakkımızı saklı tutarız.
      </p>

      <h2>7. Fikri Mülkiyet</h2>
      <p>
        ZEVO markası, logo, tasarım, kaynak kod ve içerikleri ZEVO&apos;nun fikri mülkiyetidir. İzin olmaksızın
        kopyalanamaz, dağıtılamaz veya türev çalışma oluşturulamaz.
      </p>

      <h2>8. Hizmette Değişiklikler &amp; Sonlandırma</h2>
      <ul>
        <li>Hizmetin tamamını veya bir kısmını önceden bildirimde bulunarak değiştirme/sonlandırma hakkımız saklıdır.</li>
        <li>Bu şartlara aykırı kullanım tespit edilirse hesabınızı uyarı olmaksızın sonlandırabiliriz.</li>
        <li>İstediğiniz zaman hesabınızı silebilirsiniz: bkz. <a href="/hesap-silme">Hesap Silme</a>.</li>
      </ul>

      <h2>9. Sorumluluk Sınırlaması</h2>
      <p>
        Yürürlükteki yasaların izin verdiği azami ölçüde, ZEVO; dolaylı, arızi, özel veya sonuç olarak ortaya çıkan
        zararlardan, veri kaybından veya kâr kaybından sorumlu değildir. ZEVO&apos;nun toplam sorumluluğu, son 12 ayda
        ödediğiniz abonelik ücreti ile sınırlıdır.
      </p>

      <h2>10. Geçerli Hukuk &amp; Uyuşmazlık Çözümü</h2>
      <p>
        Bu şartlar <strong>Türkiye Cumhuriyeti yasalarına</strong> tabidir. Doğacak uyuşmazlıklarda İstanbul Mahkemeleri
        ve İcra Daireleri yetkilidir.
      </p>

      <h2>11. Şartlarda Değişiklik</h2>
      <p>
        Bu şartları zaman zaman güncelleyebiliriz. Önemli değişikliklerde uygulama içi bildirim veya e-posta ile sizi
        bilgilendiririz. Güncellemeden sonra hizmeti kullanmaya devam etmeniz yeni şartları kabul ettiğiniz anlamına gelir.
      </p>

      <h2>12. İletişim</h2>
      <p>
        Sorularınız için: <a href="mailto:support@zevooapp.com">support@zevooapp.com</a>
      </p>
    </LegalLayout>
  )
}

# GitHub'a Kod Gönderme Rehberi

Bu rehberi VS Code içerisinde açık tutarak adımları sırasıyla terminalde uygulayabilirsiniz.

## 1. Terminali Açın
- Üst menüden **Terminal > New Terminal** seçeneğine tıklayın.
- Veya kısayol: `Ctrl + j`

## 2. Değişiklikleri Sahneye Alın (Staging)
Tüm değişiklikleri paketlemek için şu komutu yazıp Enter'a basın:
```bash
git add .
```

## 3. Değişiklikleri Kaydedin (Commit)
Yaptığınız işlemleri açıklayan bir mesajla kaydedin:
```bash
git commit -m "Proje guncellemesi"
```
*(Tırnak içindeki mesajı istediğiniz gibi güncelleyebilirsiniz)*

## 4. GitHub'a Gönderin (Push)
Kodları yüklemek için:
```bash
git push
```

---

### Olası Hatalar

**Hata:** `fatal: 'origin' does not appear to be a git repository`
**Çözüm:** Henüz bir GitHub deposu bağlı değil.
1. GitHub'da yeni bir repository oluşturun.
2. Size verilen `git remote add origin ...` komutunu terminale yapıştırın.
3. Sonra tekrar `git push -u origin main` yapın.

**Hata:** `fatal: The current branch main has no upstream branch`
**Çözüm:** İlk defa gönderim yapıyorsanız şu komutu kullanın:
```bash
git push -u origin main
```

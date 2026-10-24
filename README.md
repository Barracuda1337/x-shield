# 🛡️ X-Shield — Twitter & X Phishing / Spam Link Engelleyici

**X-Shield**, X (Twitter) paylaşımlarının ve yanıtlarının (replies) altını istila eden sahte/virüslü `.mp4` linklerini, `cdn.eunwo.com`, `videy.rest` gibi phishing ve zararlı bot ağlarını anında tespit ederek gizleyen güçlü bir Google Chrome (Manifest V3) uzantısıdır.

---

## ✨ Öne Çıkan Özellikler

1. **Akıllı Bot & Phishing Tespiti:**
   - Ekran görüntülerinde sıkça görülen `cdn.eunwo.com`, `videy.rest`, `cdn.videy.rest`, `*.rest` gibi kötü amaçlı barındırma alan adlarını anında engeller.
   - Tweet gövdesine gömülmüş harici sahte `.mp4`, `.mov`, `.avi` dosya tuzaklarını filtreler.
   - `Form Imgur con`, `LEAK VIRAL VIDEO`, `leak video`, `part9` gibi bot kalıplarını ve sahte kartları yakalar.
   - Yetişkin içerik uyarısı arkasına gizlenmiş spam tuzaklarını durdurur.

2. **İki Farklı Engelleme Modu:**
   - **Daralt & İncele (Önerilen):** Tweet'i şık, siber kalkan barı ile daraltır. Yanıtı merak ederseniz "İncele / Göster" butonuyla güvenle açıp tekrar kapatabilirsiniz.
   - **Görünmez Mod:** Tehdit içeren tweet'i DOM'dan tamamen gizler; akışta hiç bot yanıtı olmamış gibi tertemiz bir deneyim sunar.

3. **Canlı Sayaç ve İkon Rozeti:**
   - Uzantı ikonundaki rozette o anki X sayfasında kaç spam yanıtın engellendiğini gösterir.
   - Toplam engellenen bot istatistiğini tutar.

4. **Kişiselleştirilebilir Kara Liste & Kelime Filtresi:**
   - İstediğiniz yeni alan adlarını veya spam kelimelerini tek tıkla ekleyebilir/silebilirsiniz.
   - X üzerindeki herhangi bir linke veya metne sağ tıklayıp *"X-Shield: Kara Listeye Ekle"* diyebilirsiniz.
   - Ayarlarınızı JSON olarak dışa aktarabilir (Export) veya içe aktarabilirsiniz (Import).

5. **60 FPS & Sıfır Performans Kaybı:**
   - `MutationObserver` ve `requestAnimationFrame` optimizasyonları sayesinde Twitter'ın sonsuz kaydırmalı (infinite scroll) akışında sıfır kasma ile çalışır.

---

## 🚀 Chrome'a Nasıl Yüklenir?

1. Google Chrome tarayıcınızı açın ve adres çubuğuna şunu yazıp Enter'a basın:
   ```text
   chrome://extensions/
   ```
2. Sağ üst köşedeki **"Geliştirici modu" (Developer mode)** anahtarını açın.
3. Sol üstteki **"Paketlenmemiş öğe yükle" (Load unpacked)** butonuna tıklayın.
4. Açılan klasör seçme penceresinde şu klasörü seçin:
   ```text
   C:\Users\Korsan-PC\Desktop\zekama-redesign\x-shield-extension
   ```
5. Tebrikler! **X-Shield** uzantısı artık Chrome'unuza yüklendi ve X (Twitter) sayfalarında otomatik olarak korumaya başlayacaktır.

---

## 🧪 Test & Simülasyon Sayfası

Eklentiyi gerçek bir X sayfasını açmadan önce veya anında test etmek için:
1. `x-shield-extension` klasöründeki [test-demo.html](file:///c:/Users/Korsan-PC/Desktop/zekama-redesign/x-shield-extension/test-demo.html) dosyasını Chrome ile açın.
2. Ekran görüntülerinizdeki sahte `cdn.videy.rest/zPfc0r.mp4`, `cdn.eunwo.com`, `Form Imgur con` ve `LEAK VIRAL VIDEO` yanıtlarının anında kalkanla daraltıldığını görebilirsiniz.
3. "İncele / Göster" butonuna basarak kalkanı deneyimleyebilirsiniz!

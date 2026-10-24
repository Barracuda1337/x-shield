# Chrome Web Store Listing — X-Shield

## Listing Metadata

- **Name:** X-Shield — Twitter & X Phishing Link Engelleyici
- **Short Name:** X-Shield
- **Version:** 1.0.0
- **Category:** Productivity / Privacy & Security
- **Language:** Türkçe (ve İngilizce destekli)

## Summary (Max 132 chars)
X (Twitter) altındaki cdn.eunwo, videy.rest gibi phishing, sahte .mp4 ve spam bot linklerini anında engeller ve gizler.

## Detailed Description

X (Twitter) paylaşımlarının altındaki sahte video ve phishing botlarından sıkıldınız mı? 

X-Shield, tweet yanıtlarını otomatik tarayarak zararlı alan adlarını (`cdn.eunwo.com`, `videy.rest`, `cdn.videy.rest` vb.), sahte `.mp4` dosya linklerini ve `Form Imgur con`, `LEAK VIRAL VIDEO` gibi bot kalıplarını algılar.

### Temel Özellikler:
🛡️ **Akıllı Tehdit Tespiti:** Bilinen phishing ve sahte video CDN alan adlarını anında engeller.
👁️ **Daralt & İncele Modu:** Tehdit içeren yanıtı şık bir kalkan barıyla daraltır, isterseniz "İncele" butonuyla güvenle görüntüleyebilirsiniz.
👻 **Görünmez Mod:** İsterseniz spam yanıtları akıştan tamamen silerek sanki hiç yokmuş gibi pürüzsüz bir Twitter deneyimi sağlar.
⚡ **Canlı Rozet Sayacı:** O sayfada kaç spam yanıtın bertaraf edildiğini uzantı simgesi üzerinde gösterir.
⚙️ **Özelleştirilebilir Kara Liste:** İstediğiniz yeni alan adlarını ve spam kalıplarını kolayca ekleyip çıkarabilirsiniz.
🔒 **%100 Gizlilik:** Hiçbir kullanıcı verisi toplanmaz, analiz kodu içermez. Tüm filtreleme doğrudan tarayıcınızda gerçekleşir.

## Permissions Justification

- **storage:** Kullanıcının özel engelleme listelerini (kara liste, kelimeler), tercih ettiği engelleme modunu ve engellenen bot sayaçlarını cihazında yerel olarak saklamak için gereklidir.
- **contextMenus:** Kullanıcının X üzerinde karşılaştığı şüpheli bir linke veya seçtiği metne sağ tıklayarak hızlıca engellenenler listesine eklemesini sağlamak için kullanılır.
- **activeTab:** Kullanıcı X sekmesindeyken kalkan durumunu kontrol etmek ve koruma bildirimini göstermek için gereklidir.

## Host Permissions Justification

- `*://*.x.com/*` ve `*://*.twitter.com/*`: Yalnızca Twitter / X web sitesinde yanıt akışını tarayarak phishing ve spam linkleri filtrelemek için zorunludur.

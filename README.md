# BEUShareBox

BEUShareBox, sınıf içi kullanım için geliştirilmiş tek sayfa (SPA) ürün paylaşım uygulamasıdır.  
Proje yalnızca **HTML5 + CSS3 + Vanilla JavaScript** ile yazılmıştır (harici kütüphane/framework yoktur).

## Özellikler

- Ürün ekleme (başlık, açıklama, fiyat, kategori)
- Ürün linki ekleme (`Product URL`)
- Görsel linki ekleme (`Image URL`)
- Ürün linkinden otomatik bilgi doldurma (başlık/açıklama/fiyat/kategori/görsel)
- Kategoriye göre filtreleme
- Anlık arama (başlık + açıklama)
- Her kartta beğeni sistemi
- Her ürüne yorum ekleme
- Onaylı ürün silme (`confirm`)
- Ürün paylaşma:
  - Destekleyen cihazlarda `navigator.share`
  - Aksi durumda linki panoya kopyalama
  - Uygun tarayıcıda görsel ile paylaşım denemesi
- `localStorage` ile veri kalıcılığı
- Boş durum mesajı + toplam ürün/beğeni/yorum istatistikleri

## Kullanılan Teknolojiler

- HTML5 (semantik yapı)
- CSS3 (responsive, modern tasarım)
- Vanilla JavaScript (DOM manipülasyonu, event delegation, localStorage)

## Proje Yapısı

```text
.
├── index.html   # Sayfa iskeleti ve semantik yapılar
├── style.css    # Responsive tasarım, grid, hover/focus stilleri
└── app.js       # Tüm işlevler (CRUD benzeri işlemler, filtre, arama, paylaşım, kalıcılık)
```

## Kurulum ve Çalıştırma

1. Depoyu indir / klonla.
2. Proje klasörüne gir.
3. `index.html` dosyasını tarayıcıda aç.

Öneri:
- Geliştirme aşamasında **Live Server** veya benzeri bir yerel sunucu ile çalıştır.
- Bazı paylaşım/panoya kopyalama özellikleri tarayıcıda `https` veya `localhost` gerektirebilir.

## Kullanım Akışı

1. Formdan ürün bilgilerini girip ürünü ekle.
2. İstersen `Product URL` alanıyla ürün sayfasından alanları otomatik doldur.
3. İstersen `Image URL` ile ürün kartına görsel ekle.
4. Kartlar üzerinden:
   - `Like` ile beğen
   - Yorum ekle
   - `Share` ile paylaş
   - `Delete` ile sil
5. Kategori sekmeleri ve arama alanı ile listeyi filtrele.

## Veri Modeli

Ürünler aşağıdaki yapıyla tutulur:

```js
{
  id,
  title,
  description,
  price,
  category,
  productUrl,
  imageUrl,
  likes,
  comments: [],
  createdAt
}
```

## Değerlendirme Kriterlerine Uyum

- **HTML Yapısı:** `header/main/footer`, `section`, kart bazlı `article`, erişilebilirlik etiketleri
- **CSS Tasarım:** Grid tabanlı responsive yapı, hover/focus durumları, CSS değişkenleri
- **JavaScript İşlevsellik:** Ekleme, beğeni, yorum, filtre, arama, silme, localStorage
- **UX:** Boş durum mesajı, doğrulama, geri bildirim metinleri, istatistikler
- **Kod Kalitesi:** Anlamlı fonksiyon/değişken isimleri, fonksiyonlara ayrılmış modüler yapı

## Bilinen Sınırlar

- Ürün linkinden otomatik veri çekme, bazı sitelerde CORS/güvenlik politikası nedeniyle engellenebilir.
- Görsel ile paylaşım, tarayıcı/cihaz desteğine ve görsel URL erişilebilirliğine bağlıdır.

## Not

Bu proje eğitim amaçlı geliştirilmiştir.

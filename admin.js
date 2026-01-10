import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  query,
  where,
  limit,
  orderBy,
  serverTimestamp,
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "./firebase-config.js";
let adminFilters = { category: 'all', city: 'all', district: 'all' };

// Global Durum Yönetimi
let currentHeroUrl = "";
let newHeroFile = null;
let masterGallery = [];

/* --- MATRIX GİRİŞ PROTOKOLÜ (EKRANIN SİYAH KALMASINI ÖNLEYEN KISIM) --- */
const matrixLines = [
  "SİSTEM BAĞLANTISI KURULUYOR...",
  "ERİŞİM İZNİ GEREKLİ: AKARE_PRO_v2.0",
  "ANAHTAR BEKLENİYOR...",
];

// Metni URL dostu hale getiren fonksiyon (Örn: "Vadi Evi - Sapanca" -> "vadi-evi-sapanca")
const createSlug = (str) => {
  const from = "çğışöüÇĞİŞÖÜ";
  const to = "cgisouCGISOU";
  for (let i = 0; i < from.length; i++) {
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "") // Harf, rakam ve boşluk dışındakileri sil
    .replace(/\s+/g, "-") // Boşlukları tire yap
    .replace(/-+/g, "-"); // Fazla tireleri temizle
};


/* --- ANLIK SEO VE MOCKUP MOTORU --- */
window.handleAutoSEO = () => {
    const pTitle = document.getElementById("p-title").value.trim();
    const pCity = document.getElementById("p-city").value;
    const pDistrict = document.getElementById("p-district").value;
    const pCategory = document.getElementById("p-service-type").value;
    
    const seoInput = document.getElementById("p-seo-title");
    const prevSeoTitle = document.getElementById("prev-seo-title");

    const t = pTitle || "Proje Başlığı";
    const c = pCity || "Şehir";
    const d = pDistrict || "İlçe";
    const cat = pCategory || "Kategori";

    const generatedSEO = `${t} | ${c} ${d} Modern ${cat} Tasarımı | Akare Mimarlık`;

    if (seoInput) seoInput.value = generatedSEO;
    if (prevSeoTitle) {
        prevSeoTitle.innerText = generatedSEO;
        prevSeoTitle.style.color = "#1a0dab"; // Her zaman mavi kalsın
    }
    updatePreviewText(); // Mockup'ı güncelle
};


const titleInput = document.getElementById("p-title");
const districtInput = document.getElementById("p-district");
const seoTitleInput = document.getElementById("p-seo-title");


async function runMatrix() {
  const l1 = document.getElementById("matrix-line1");
  const l2 = document.getElementById("matrix-line2");
  const passArea = document.getElementById("pass-area");
  if (!l1 || !l2) return;

  for (let line of [matrixLines[0], matrixLines[1]]) {
    let el = line === matrixLines[0] ? l1 : l2;
    el.textContent = ""; // Temizle
    for (let char of line) {
      el.textContent += char;
      await new Promise((r) => setTimeout(r, 25));
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  if (passArea) passArea.style.display = "block";
  const input = document.getElementById("admin-pass");
  if (input) input.focus();
}

// 1. OTURUM KONTROLÜ
onAuthStateChanged(auth, (user) => {
  const overlay = document.getElementById("matrix-overlay");
  if (user) {
    if (overlay) overlay.style.display = "none";
    loadList(); // Proje listesini çek
    loadCategories(); // Kategorileri çek
  } else {
    if (overlay) {
      overlay.style.display = "flex";
      runMatrix(); // Giriş ekranını göster
    }
  }
});

// 2. Sisteme Giriş Yapma (Email ve Şifre ile)
window.adminLogin = async () => {
  const email = document.getElementById("admin-email").value;
  const pass = document.getElementById("admin-pass").value;
  const errorMsg = document.getElementById("matrix-error");
  const loginBtn = document.getElementById("login-btn");

  if (!email || !pass) {
    alert("Lütfen alanları doldurun.");
    return;
  }

  loginBtn.innerText = "KİMLİK DOĞRULANIYOR...";
  loginBtn.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    // Başarılı olursa yukarıdaki onAuthStateChanged otomatik tetiklenip içeri alacak
  } catch (error) {
    console.error("Giriş hatası:", error);
    if (errorMsg) errorMsg.style.display = "block";
    loginBtn.innerText = "GİRİŞ YAP";
    loginBtn.disabled = false;
  }
};

/* --- CANLI ÖNİZLEME MOTORU --- */

const updatePreviewText = () => {
  const safeSet = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  safeSet(
    "prev-title",
    document.getElementById("p-title").value || "Proje Başlığı"
  );
  safeSet(
    "prev-cat",
    document.getElementById("p-service-type").value || "KATEGORİ"
  );

  const year = document.getElementById("p-year").value || "Yıl";
  const loc = document.getElementById("p-district").value || "Konum";
  const area = document.getElementById("p-area").value || "Alan";
  safeSet("prev-meta", `${loc} • ${year} • ${area} m²`);

  safeSet(
    "prev-lead",
    document.getElementById("p-lead").value || "Spot açıklama..."
  );
  safeSet(
    "prev-story",
    document.getElementById("p-story").value || "Proje hikayesi..."
  );

  // KAPAK GÖRSELİ ÖNİZLEME (MOCKUP)
  const prevHeroImg = document.getElementById("prev-hero");
  if (newHeroFile) {
    prevHeroImg.src = URL.createObjectURL(newHeroFile);
  } else if (currentHeroUrl) {
    prevHeroImg.src = currentHeroUrl;
  } else {
    prevHeroImg.src = "https://placehold.co/600x400?text=Kapak+Yok";
  }

  // GALERİ ÖNİZLEME (MOCKUP) - SİLME SONRASI BURASI ÇALIŞMALI
  const galleryPrev = document.getElementById("prev-gallery");
  if (galleryPrev) {
    galleryPrev.innerHTML = ""; // Önce temizle

    masterGallery.forEach((item) => {
      const img = document.createElement("img");
      img.src = item.type === "remote" ? item.data : item.preview;
      galleryPrev.appendChild(img);
    });
  }
};
// Dinleyiciye hikayeyi de ekle
[
  "p-title",
  "p-service-type",
  "p-year",
  "p-district",
  "p-area",
  "p-lead",
  "p-story",
].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", updatePreviewText);
});
// Inputlara dinleyici ekle
[
  "p-title",
  "p-service-type",
  "p-year",
  "p-district",
  "p-area",
  "p-lead",
].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", updatePreviewText);
});

// Kapak Görseli Önizlemesi
document.getElementById("p-hero-img")?.addEventListener("change", function (e) {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = function (event) {
      document.getElementById("prev-hero").src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  }
});

// Galeri Önizlemesi (Çoklu Fotoğraf)
document
  .getElementById("p-gallery-imgs")
  ?.addEventListener("change", function (e) {
    const galleryPrev = document.getElementById("prev-gallery");
    galleryPrev.innerHTML = ""; // Temizle

    Array.from(e.target.files).forEach((file) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.style.width = "60px";
      img.style.height = "60px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "5px";
      galleryPrev.appendChild(img);
    });
  });

/* --- GÖRSEL İŞLEME (WEBP & SEO İSİM) --- */
async function convertToWebP(file, seoName) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Çözünürlüğü biraz daha artıralım (Opsiyonel: 2000'den 2500'e)
        const MAX_WIDTH = 2500;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Görüntü kalitesini artırmak için çizim ayarı
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const finalFile = new File([blob], `${seoName}.webp`, {
              type: "image/webp",
            });
            resolve(finalFile);
          },
          "image/webp",
          0.92
        ); // Kaliteyi %92 yaptık (Jilet gibi olur)
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append("image", file);

  // Artık direkt ImgBB'ye değil, kendi sunucumuza soruyoruz
  const response = await fetch(`http://localhost:3000/upload-image`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  if (result.success) return result.url;
  else throw new Error("Görsel sunucuya yüklenemedi.");
}

/* --- PROJE YAYINLA (SUBMIT) FONKSİYONU --- */
document
  .getElementById("projectForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const st = document.getElementById("status");
    const errBox = document.getElementById("validation-errors");
    const editId = document.getElementById("editing-id").value;

    // 1. ADIM: ZORUNLU ALAN KONTROLÜ
    errBox.style.display = "none";
    errBox.innerHTML = "";

    const requiredFields = [
      { id: "p-title", name: "Proje Adı" },
      { id: "p-year", name: "Yıl" },
      { id: "p-area", name: "Alan (m²)" },
      { id: "p-story", name: "Proje Hikayesi" },
      { id: "p-seo-title", name: "Google SEO Başlığı" },
    ];

    let missing = [];
    requiredFields.forEach((f) => {
      if (!document.getElementById(f.id).value.trim()) missing.push(f.name);
    });

    if (!newHeroFile && !currentHeroUrl) missing.push("Kapak Görseli");

    if (missing.length > 0) {
      errBox.style.display = "block";
      errBox.innerHTML = `⚠️ Yayınlamak için şuraları doldurmalısın: <br> • ${missing.join(
        "<br> • "
      )}`;
      window.scrollTo(0, 0); // Hatayı görmesi için yukarı kaydır
      return;
    }

    // ÖNE ÇIKARMA SINIR KONTROLÜ (FORM İÇİN)
    const isFeaturedChecked = document.getElementById("p-featured").checked;
    if (isFeaturedChecked) {
      const currentlyFeatured = allProjectsForList.filter((p) => p.isFeatured);
      // Eğer 3 tane varsa VE düzenlenen proje bu 3 projeden biri değilse (yani yeni ekleniyorsa)
      const isAlreadyInFeatured = currentlyFeatured.some(
        (p) => p.id === editId
      );

      if (currentlyFeatured.length >= 3 && !isAlreadyInFeatured) {
        alert(
          "⚠️ Ana sayfa kotası dolu! (Max 3 Proje)\nLütfen önce başka bir projenin öne çıkarma özelliğini iptal edin."
        );
        return; // Kayıt işlemini durdur
      }
    }

    // 2. ADIM: İŞLEM BAŞLIYOR
    st.innerHTML = "⌛ Proje hazırlanıyor, lütfen bekleyin...";

    const projectTitle = document.getElementById("p-title").value;
    const projectDistrict = document.getElementById("p-district").value;
    const seoBaseName = `${projectTitle}-${projectDistrict}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    try {
      // Kapak Görseli İşlemi
      let finalHero = currentHeroUrl;
      if (newHeroFile) {
        const heroWebp = await convertToWebP(
          newHeroFile,
          `${seoBaseName}-kapak`
        );
        finalHero = await uploadToImgBB(heroWebp);
      }

      const finalGallery = [];
      for (let i = 0; i < masterGallery.length; i++) {
        const item = masterGallery[i];
        if (item.type === "remote") {
          finalGallery.push(item.data); // Zaten yüklü olan URL
        } else {
          // Yeni dosyayı yükle
          st.innerHTML = `⌛ Görsel yükleniyor (${i + 1}/${
            masterGallery.length
          })...`;
          const webp = await convertToWebP(
            item.data,
            `${seoBaseName}-galeri-${i + 1}`
          );
          const url = await uploadToImgBB(webp);
          finalGallery.push(url);
        }
      }

      // Veritabanına Yazma
      const data = {
        title: projectTitle,
        slug: createSlug(projectTitle + "-" + projectDistrict),
        seoTitle: document.getElementById("p-seo-title").value,
        category: document.getElementById("p-service-type").value,
        district: projectDistrict,
        year: document.getElementById("p-year").value,
        location: document.getElementById("p-location").value,
        area: document.getElementById("p-area").value,
        lead: document.getElementById("p-lead").value,
        story: document.getElementById("p-story").value,
        heroImage: finalHero,
        gallery: finalGallery,
        isFeatured: document.getElementById("p-featured").checked,
        createdAt: serverTimestamp(),
        city: document.getElementById("p-city").value,
      };

      if (editId) {
        data.updatedAt = serverTimestamp(); // Güncelleme tarihi ekle
        await updateDoc(doc(db, "projects", editId), data);
      } else {
        data.createdAt = serverTimestamp(); // İlk kez yükleniyorsa oluşturma tarihi ekle
        await addDoc(collection(db, "projects"), data);
      }

      st.innerHTML = "✅ Proje Başarıyla Yayına Alındı!";
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      console.error(err);
      st.innerHTML = "❌ Bir sorun çıktı, internetinizi kontrol edin.";
    }
  });

/* --- LİSTELEME VE DÜZENLEME --- */
let allProjectsForList = []; // Çekilen tüm projeleri burada tutacağız

async function loadList() {
  const listDiv = document.getElementById("admin-project-list");
  if (!listDiv) return;

  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  allProjectsForList = []; // Sıfırla
  snap.forEach((d) => {
    allProjectsForList.push({ id: d.id, ...d.data() });
  });

  renderAdminList(allProjectsForList); // Listeyi çiz
}

// Sidebar'da şehir değişince ilçeleri yükler
window.handleSidebarCityChange = async () => {
    const city = document.getElementById("admin-filter-city").value;
    const distSelect = document.getElementById("admin-filter-dist");
    
    distSelect.innerHTML = '<option value="all">Tümü</option>';
    
    if (city !== "all") {
        const q = query(collection(db, "districts"), where("city", "==", city));
        const snap = await getDocs(q);
        snap.forEach(d => {
            distSelect.innerHTML += `<option value="${d.data().name}">${d.data().name}</option>`;
        });
    }
    window.filterAdminList();
};

// ÇOKLU FİLTRELEME MOTORU (Arama + Kategori + Şehir + İlçe)
window.filterAdminList = () => {
    const searchTerm = document.getElementById("admin-search").value.toLowerCase();
    const cat = document.getElementById("admin-filter-cat").value;
    const city = document.getElementById("admin-filter-city").value;
    const dist = document.getElementById("admin-filter-dist").value;

    const filtered = allProjectsForList.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm);
        const matchesCat = cat === "all" || (p.category && p.category === cat);
        const matchesCity = city === "all" || (p.city && p.city === city);
        const matchesDist = dist === "all" || (p.district && p.district === dist);

        return matchesSearch && matchesCat && matchesCity && matchesDist;
    });

    renderAdminList(filtered);
};

// Filtreleri Sıfırla
window.clearAdminFilters = () => {
    document.getElementById("admin-search").value = "";
    document.getElementById("admin-filter-cat").value = "all";
    document.getElementById("admin-filter-city").value = "all";
    document.getElementById("admin-filter-dist").innerHTML = '<option value="all">Tümü</option>';
    window.filterAdminList();
};

window.toggleFilterPanel = () => {
    const drawer = document.getElementById('filter-drawer');
    const chevron = document.getElementById('filter-chevron');
    
    drawer.classList.toggle('active');
    
    // Oku döndür
    if(drawer.classList.contains('active')) {
        chevron.style.transform = "rotate(180deg)";
    } else {
        chevron.style.transform = "rotate(0deg)";
    }
};

function renderAdminList(projects) {
  const listDiv = document.getElementById("admin-project-list");
  let html = `<span class="list-section-title">📂 PROJELER (${projects.length})</span>`;

  projects.forEach((p) => {
    // Yıldız ikonu durumu
    const starClass = p.isFeatured ? "fas fa-star" : "far fa-star";
    const starColor = p.isFeatured ? "#f1c40f" : "#ccc";

    html += `
        <div class="project-item ${p.isFeatured ? "is-featured" : ""}">
            <div class="item-main">
                <b>${p.title}</b>
                <span>${p.category}</span>
            </div>
            <div class="item-actions">
                <!-- HIZLI ÖNE ÇIKAR BUTONU -->
                <button type="button" class="btn-mini" style="color: ${starColor}; border:none; background:none;" onclick="window.toggleFeatured('${
      p.id
    }', ${p.isFeatured})">
                    <i class="${starClass}"></i>
                </button>
                <button type="button" class="btn-mini btn-mini-edit" onclick="window.editProject('${
                  p.id
                }')"><i class="fa fa-edit"></i></button>
                <button type="button" class="btn-mini btn-mini-delete" onclick="window.deleteProject('${
                  p.id
                }')"><i class="fa fa-trash"></i></button>
            </div>
        </div>`;
  });
  listDiv.innerHTML = html;
}

// Yıldız değiştirme fonksiyonu
window.toggleFeatured = async (id, currentStatus) => {
  // Eğer yıldız zaten yanıyorsa (söndürmek istiyorsa) her zaman izin ver
  if (currentStatus === true) {
    const docRef = doc(db, "projects", id);
    await updateDoc(docRef, { isFeatured: false });
    loadList();
    return;
  }

  // Eğer yeni bir yıldız eklemek istiyorsa (false -> true) kontrol et
  const featuredCount = allProjectsForList.filter((p) => p.isFeatured).length;

  if (featuredCount >= 3) {
    alert(
      "⚠️ Ana sayfada en fazla 3 proje öne çıkarılabilir.\nYeni bir proje eklemek için önce mevcut olanlardan birinin yıldızını kaldırmalısınız."
    );
    return;
  }

  // Sınır aşılmadıysa kaydet
  const docRef = doc(db, "projects", id);
  await updateDoc(docRef, { isFeatured: true });
  loadList();
};

window.editProject = async (id) => {
  const docSnap = await getDoc(doc(db, "projects", id));
  if (docSnap.exists()) {
    const p = docSnap.data();
    document.getElementById("editing-id").value = id;
    document.getElementById("p-title").value = p.title || "";
    document.getElementById("p-seo-title").value = p.seoTitle || "";
    document.getElementById("p-service-type").value = p.category || "";
    document.getElementById("p-district").value = p.district || "";
    document.getElementById("p-year").value = p.year || "";
    document.getElementById("p-location").value = p.location || "";
    document.getElementById("p-area").value = p.area || "";
    document.getElementById("p-lead").value = p.lead || "";
    document.getElementById("p-story").value = p.story || "";
    document.getElementById("p-featured").checked = p.isFeatured;
    document.getElementById("cancel-btn").style.display = "block";
    document.getElementById("form-mode-title").innerText = "Projeyi Düzenle";
    currentHeroUrl = p.heroImage;
    // Gelen URL'leri objeye çevirip listeye alıyoruz
    masterGallery = (p.gallery || []).map((url) => ({
      type: "remote",
      data: url,
    }));
    renderImageManager();
    updatePreviewText();

    if (window.innerWidth < 1100)
      window.switchTab("form", document.querySelector(".tab-btn"));
  }
};

window.deleteProject = async (id) => {
  if (confirm("Silinsin mi?")) {
    await deleteDoc(doc(db, "projects", id));
    loadList();
  }
};
// 3. Güvenli Çıkış (Logout)
window.adminLogout = async () => {
  if (confirm("Yönetim panelinden güvenli çıkış yapılsın mı?")) {
    try {
      await signOut(auth);
      location.reload();
    } catch (err) {
      alert("Çıkış yapılırken bir hata oluştu.");
    }
  }
};
// Galeri Taşıma (Sıralama)
window.moveImage = (index, direction) => {
  let newIndex = index + direction;
  if (newIndex >= 0 && newIndex < masterGallery.length) {
    [masterGallery[index], masterGallery[newIndex]] = [
      masterGallery[newIndex],
      masterGallery[index],
    ];
    renderImageManager();
    updatePreviewText();
  }
};

// Galeri Silme
window.removeGalleryImage = (index) => {
  masterGallery.splice(index, 1);
  renderImageManager();
  updatePreviewText();
};

// Kapak Silme Fonksiyonları
window.removeNewHero = () => {
  newHeroFile = null;
  renderImageManager();
  updatePreviewText();
};
window.removeCurrentHero = () => {
  currentHeroUrl = "";
  renderImageManager();
  updatePreviewText();
};

function renderImageManager() {
  const heroBox = document.getElementById("hero-manager");
  const galleryBox = document.getElementById("gallery-manager");
  if (!heroBox || !galleryBox) return;

  // 1. Kapak Görseli
  heroBox.innerHTML = "";
  const heroSrc = newHeroFile
    ? URL.createObjectURL(newHeroFile)
    : currentHeroUrl;
  if (heroSrc) {
    heroBox.innerHTML = `
      <div class="img-slot">
        <img src="${heroSrc}">
        <button type="button" class="remove-btn" onclick="${
          newHeroFile ? "window.removeNewHero()" : "window.removeCurrentHero()"
        }">×</button>
      </div>`;
  }

  // 2. Galeri Görselleri (Master List)
  galleryBox.innerHTML = "";
  masterGallery.forEach((item, i) => {
    const src = item.type === "remote" ? item.data : item.preview;
    galleryBox.innerHTML += `
      <div class="img-slot">
        <img src="${src}">
        <button type="button" class="remove-btn" onclick="window.removeGalleryImage(${i})">×</button>
        <div class="sort-controls">
          <button type="button" class="btn-sort" onclick="window.moveImage(${i}, -1)" ${
      i === 0 ? "disabled" : ""
    }><i class="fas fa-chevron-left"></i></button>
          <button type="button" class="btn-sort" onclick="window.moveImage(${i}, 1)" ${
      i === masterGallery.length - 1 ? "disabled" : ""
    }><i class="fas fa-chevron-right"></i></button>
        </div>
      </div>`;
  });
}
// Global Silme Fonksiyonları (Window'a bağlamalıyız)
window.removeNewHero = () => {
  newHeroFile = null;
  document.getElementById("p-hero-img").value = "";
  renderImageManager();
  updatePreviewText(); // ÖNEMLİ: Mockup'tan da silinmesi için
};
window.removeCurrentHero = () => {
  currentHeroUrl = "";
  renderImageManager();
  updatePreviewText(); // Önizlemeyi tazele
};

// İptal Etme Mantığı
window.cancelEdit = () => {
  if (confirm("Değişiklikler iptal edilsin mi?")) location.reload();
};
// Event Listeners
document.getElementById("p-hero-img")?.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    newHeroFile = e.target.files[0];
    renderImageManager();
    updatePreviewText(); // Mockup'ı da güncelle
  }
});
document.getElementById("p-gallery-imgs")?.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      masterGallery.push({
        type: "local",
        data: file,
        preview: URL.createObjectURL(file),
      });
    });
    e.target.value = "";
    renderImageManager();
    updatePreviewText();
  }
});

// --- EKİP FOTOĞRAFI SEÇİLDİĞİNDE ÖNİZLEMEYİ GÜNCELLE ---
document.getElementById("t-file")?.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    const previewUrl = URL.createObjectURL(file);

    // Önizleme kutusunu yeni resimle güncelle
    document.getElementById(
      "team-img-prev"
    ).innerHTML = `<img src="${previewUrl}" style="width:100px; border-radius:10px; margin-top:10px; border: 2px solid var(--accent);">`;
  }
});

/* --- EKİP YÖNETİMİ MOTORU --- */
let currentTeamFile = null;

// Sekme değiştirme mantığını güncelle (switchTab fonksiyonunu bul ve değiştir)
window.handleDesktopToggle = () => {
  const isTeamOpen =
    document.getElementById("team-pane").style.display === "block";
  if (isTeamOpen) {
    window.switchTab("form"); // Ekip açıksa Projelere dön
  } else {
    window.switchTab("team"); // Projeler açıksa Ekibe git
  }
};

// --- TEK VE GERÇEK NAVİGASYON MOTORU (MOBİL FİX) ---
window.switchTab = (n, b) => {
  const isDesktop = window.innerWidth > 1100;
  const navBtn = document.getElementById("desktop-nav-btn");
  const mainTitle = document.getElementById("sidebar-main-title");

  // 1. CSS Sınıflarını Yönet
  document.body.classList.remove("tab-form", "tab-list", "tab-team");
  document.body.classList.add(`tab-${n}`);

  // 2. Tüm Panelleri Gizle
  document
    .querySelectorAll(".form-card, .sidebar, .mockup-pane, #team-pane")
    .forEach((el) => {
      el.style.display = "none";
    });

  if (n === "form" || n === "list") {
    // --- PROJE MODU ---
    if (n === "form") {
      document.querySelector(".form-card").style.display = "block";
      document.querySelector(".mockup-pane").style.display = "block";
      if (isDesktop) document.querySelector(".sidebar").style.display = "flex";
    } else {
      // LİSTE (SIDEBAR) MODU - Mobilde sadece burası görünür
      document.querySelector(".sidebar").style.display = "flex";
    }

    if (mainTitle) mainTitle.innerText = "Projeler";
    if (navBtn)
      navBtn.innerHTML = '<i class="fas fa-users"></i> <span>EKİP</span>';
  } else if (n === "team") {
    // --- EKİP MODU ---
    document.getElementById("team-pane").style.display = "block";
    if (isDesktop) document.querySelector(".sidebar").style.display = "flex";

    if (mainTitle) mainTitle.innerText = "Ekip";
    if (navBtn)
      navBtn.innerHTML =
        '<i class="fas fa-layer-group"></i> <span>PROJELER</span>';

    loadTeam();
  }

  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  if (b) b.classList.add("active");
};

// --- EKRAN BOYUTU DEĞİŞTİĞİNDE DÜZENİ KORU (MERGED & OPTIMIZED) ---
window.addEventListener("resize", () => {
  const isDesktop = window.innerWidth > 1100;
  const teamPane = document.getElementById("team-pane");
  const isTeamActive =
    document.body.classList.contains("tab-team") ||
    teamPane.style.display === "block";

  if (isDesktop) {
    window.switchTab(isTeamActive ? "team" : "form");
  }
});

// Ekibi Yükle
async function loadTeam() {
  const listDiv = document.getElementById("admin-team-list");
  if (!listDiv) return;
  const snap = await getDocs(collection(db, "team"));
  listDiv.innerHTML = "";

  snap.forEach((d) => {
    const m = d.data();
    listDiv.innerHTML += `
        <div class="project-item">
            <div class="item-main">
                <img src="${
                  m.image || "https://via.placeholder.com/80"
                }" style="width:80px; height:110px; border-radius:5%; object-fit:cover; margin-right:20px; border: 3px solid #f0f0f0; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <b>${m.name}</b>
                <span style="margin-left:10px; opacity:0.6;">${m.role}</span>
            </div>
            <div class="item-actions">
                <button type="button" class="btn-mini btn-mini-edit" onclick="window.editTeam('${
                  d.id
                }')"><i class="fa fa-edit"></i></button>
                <!-- SİLME BUTONU -->
                <button type="button" class="btn-mini btn-mini-delete" onclick="window.deleteTeamMember('${
                  d.id
                }')"><i class="fa fa-trash"></i></button>
            </div>
        </div>`;
  });
}

// Yeni Üye Formunu Hazırla (Boşalt)
window.addNewTeamMember = () => {
  document.getElementById("team-id").value = ""; // ID boşsa "Yeni" demektir
  document.getElementById("t-name").value = "";
  document.getElementById("t-role").value = "";
  document.getElementById("t-file").value = "";
  document.getElementById("team-img-prev").innerHTML = "";
  document.getElementById("team-form-title").innerText = "Yeni Üye Ekle";
  document.getElementById("team-edit-form").style.display = "block";
  window.scrollTo(0, document.body.scrollHeight);
};

// Üye Silme
window.deleteTeamMember = async (id) => {
  if (confirm("Bu ekip üyesini silmek istediğinize emin misiniz?")) {
    await deleteDoc(doc(db, "team", id));
    loadTeam();
  }
};

// Düzenleme Modu
window.editTeam = async (id) => {
  const d = await getDoc(doc(db, "team", id));
  const m = d.data();
  document.getElementById("team-id").value = id;
  document.getElementById("t-name").value = m.name;
  document.getElementById("t-role").value = m.role;
  document.getElementById(
    "team-img-prev"
  ).innerHTML = `<img src="${m.image}" style="width:100px; border-radius:10px;">`;
  document.getElementById("team-edit-form").style.display = "block";
  window.scrollTo(0, document.body.scrollHeight);
};

// AKILLI KAYDETME (DÜZELTİLMİŞ)
window.saveTeamMember = async () => {
  const id = document.getElementById("team-id").value;
  const name = document.getElementById("t-name").value;
  const role = document.getElementById("t-role").value;
  const fileInput = document.getElementById("t-file");
  const file = fileInput.files[0];
  const st = document.getElementById("status"); // Hata mesajı için kullanabiliriz

  if (!name || !role) {
    alert("İsim ve Unvan boş bırakılamaz!");
    return;
  }

  // Butonu kilitle
  const saveBtn = document.querySelector("#team-edit-form button.btn-main");
  saveBtn.disabled = true;
  saveBtn.innerText = "YÜKLENİYOR...";

  try {
    let imageUrl = "";

    if (file) {
      // Yeni resim seçildiyse yükle
      const webp = await convertToWebP(
        file,
        `ekip-${name.toLowerCase().replace(/ /g, "-")}`
      );
      imageUrl = await uploadToImgBB(webp);
    } else if (id) {
      // Düzenleme yapılıyor ve yeni resim seçilmediyse eski resmi al
      const imgEl = document.querySelector("#team-img-prev img");
      if (imgEl) imageUrl = imgEl.src;
    }

    if (!imageUrl) {
      alert("Lütfen bir fotoğraf seçin!");
      saveBtn.disabled = false;
      saveBtn.innerText = "KAYDET";
      return;
    }

    const data = { name, role, image: imageUrl };

    if (id) {
      await updateDoc(doc(db, "team", id), data);
    } else {
      await addDoc(collection(db, "team"), data);
    }

    alert("Başarıyla kaydedildi!");
    document.getElementById("team-edit-form").style.display = "none";
    loadTeam();
  } catch (err) {
    console.error("Yükleme Hatası:", err);
    alert(
      "Görsel yüklenemedi! Sunucunuzun (server.js) çalıştığından emin olun."
    );
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = "KAYDET";
  }
};

/* --- AKALLI KATEGORİ SİSTEMİ (EKLE/SİL DESTEKLİ) --- */

window.toggleNewCatArea = () => {
  const area = document.getElementById("new-cat-area");
  area.classList.toggle("active");
  if (area.classList.contains("active"))
    document.getElementById("inline-cat-input").focus();
};

async function loadCategories() {
  const projectSelect = document.getElementById("p-service-type");
  const sidebarFilter = document.getElementById("admin-filter-cat");
  const inlineList = document.getElementById("inline-cat-list"); // Yeni: Panel içi liste

  if (!projectSelect) return;

  const snap = await getDocs(collection(db, "categories"));
  let options = '<option value="">Kategori Seçin...</option>';
  let filters = '<option value="all">Tümü</option>';
  let listHtml = ""; // Yeni: Etiketler için

  snap.forEach((d) => {
    const name = d.data().name;
    options += `<option value="${name}">${name}</option>`;
    filters += `<option value="${name}">${name}</option>`;

    // Panel içinde görünecek silme butonlu etiket
    listHtml += `
            <div class="inline-cat-item">
                ${name}
                <button type="button" class="btn-cat-delete" onclick="window.deleteCategory('${d.id}')">×</button>
            </div>`;
  });

  projectSelect.innerHTML = options;
  if (sidebarFilter) sidebarFilter.innerHTML = filters;
  if (inlineList) inlineList.innerHTML = listHtml; // Listeyi panele bas
}

/* --- DİNAMİK LOKASYON YÖNETİMİ (ŞEHİR & İLÇE) --- */

window.toggleInlineArea = (id) => {
    document.getElementById(id).classList.toggle("active");
};

/* --- AKILLI LOKASYON YÖNETİMİ (SIFIR HATA) --- */

async function loadLocations() {
    const citySelect = document.getElementById("p-city");
    const distSelect = document.getElementById("p-district");
    try {
        const citySnap = await getDocs(collection(db, "cities"));
        let cityOpt = '<option value="">Şehir Seçin...</option>';
        let cityListHtml = "";
        citySnap.forEach(d => {
            const name = d.data().name;
            cityOpt += `<option value="${name}">${name}</option>`;
const sidebarCitySelect = document.getElementById("admin-filter-city");
if(sidebarCitySelect) sidebarCitySelect.innerHTML += `<option value="${name}">${name}</option>`;
            cityListHtml += `<div class="inline-cat-item">${name} <button type="button" class="btn-cat-delete" onclick="window.deleteLocation('cities','${d.id}')">×</button></div>`;
            
        });
        citySelect.innerHTML = cityOpt;
        document.getElementById("inline-city-list").innerHTML = cityListHtml;
        distSelect.disabled = true;
        distSelect.innerHTML = '<option value="">Önce Şehir Seçin...</option>';
    } catch (e) { console.error(e); }
}

window.handleCityChange = async () => {
    const city = document.getElementById("p-city").value;
    const distSelect = document.getElementById("p-district");
    const distListDiv = document.getElementById("inline-dist-list");

    distSelect.innerHTML = "";
    distListDiv.innerHTML = "";

    if (!city) {
        distSelect.disabled = true;
        distSelect.innerHTML = '<option value="">Önce Şehir Seçin...</option>';
        window.handleAutoSEO();
        return;
    }

    distSelect.disabled = false;
    distSelect.innerHTML = '<option value="">Yükleniyor...</option>';

    try {
        const q = query(collection(db, "districts"), where("city", "==", city));
        const distSnap = await getDocs(q);
        let distOpt = '<option value="">İlçe Seçin...</option>';
        let distListHtml = "";
        distSnap.forEach(d => {
            const name = d.data().name;
            distOpt += `<option value="${name}">${name}</option>`;
            distListHtml += `<div class="inline-cat-item">${name} <button type="button" class="btn-cat-delete" onclick="window.deleteLocation('districts','${d.id}')">×</button></div>`;
        });
        distSelect.innerHTML = distOpt;
        distListDiv.innerHTML = distListHtml;
        window.handleAutoSEO();
    } catch (e) { console.error(e); }
};

window.saveNewLocation = async (type) => {
    const cityValue = document.getElementById("p-city").value;
    const inputId = type === 'city' ? 'inline-city-input' : 'inline-dist-input';
    const coll = type === 'city' ? 'cities' : 'districts';
    const inputEl = document.getElementById(inputId);
    const name = inputEl.value.trim().toUpperCase();
    if (!name) return;
    if (type === 'district' && !cityValue) { alert("Lütfen önce şehri seçin!"); return; }

    try {
        const data = { name: name };
        if (type === 'district') data.city = cityValue;
        await addDoc(collection(db, coll), data);
        inputEl.value = "";
        if (type === 'city') await loadLocations();
        else await window.handleCityChange();
    } catch (e) { alert("Hata!"); }
};

window.deleteLocation = async (coll, id) => {
    if (confirm("Silinsin mi?")) {
        await deleteDoc(doc(db, coll, id));
        if (coll === 'cities') await loadLocations();
        else await window.handleCityChange();
    }
};


window.saveNewCategory = async () => {
  const input = document.getElementById("inline-cat-input");
  const name = input.value.trim().toUpperCase();
  if (!name) return;

  try {
    await addDoc(collection(db, "categories"), { name: name });
    input.value = "";
    await loadCategories();
    document.getElementById("p-service-type").value = name;
  } catch (err) {
    console.error(err);
  }
};

// YENİ: KATEGORİ SİLME FONKSİYONU
window.deleteCategory = async (id) => {
  if (
    confirm(
      "Bu kategoriyi silmek istediğinize emin misiniz?\nSadece liste güncellenir, mevcut projeleriniz silinmez."
    )
  ) {
    try {
      await deleteDoc(doc(db, "categories", id));
      await loadCategories(); // Listeyi yenile
    } catch (err) {
      console.error("Silme hatası:", err);
    }
  }
};

// Sayfa yüklendiğinde dinleyicileri kur ve verileri hazırla
document.addEventListener("DOMContentLoaded", () => {
    ["p-title", "p-service-type", "p-city", "p-district"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", window.handleAutoSEO);
        document.getElementById(id)?.addEventListener("change", window.handleAutoSEO);
    });
    // Şehirleri yükle
    loadLocations();
    // Kategorileri yükle
    loadCategories();
});

// admin.js sonuna ekle
document.addEventListener("DOMContentLoaded", () => {
    const leadInput = document.getElementById("p-lead");
    if (leadInput) {
        const counter = document.createElement("div");
        counter.style.cssText = "font-size: 0.7rem; color: #999; text-align: right; margin-top: 5px;";
        leadInput.parentNode.appendChild(counter);

        const updateCounter = () => {
            const len = leadInput.value.length;
            counter.innerText = `${len} karakter (İdeal: 140-160)`;
            counter.style.color = len > 170 ? "#c07f5c" : "#999";
        };
        
        leadInput.addEventListener("input", updateCounter);
        // Sayfa ilk yüklendiğinde de çalışsın (düzenleme modu için)
        setTimeout(updateCounter, 1000);
    }
});

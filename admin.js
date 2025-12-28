import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const IMGBB_API_KEY = "5832d86d6af3058cf8d7073b8b108b0e";

let currentHeroUrl = "";
let newHeroFile = null;
let existingGalleryUrls = [];
let newGalleryFiles = [];

// --- WEBP DÖNÜŞTÜRÜCÜ ---
async function convertToWebP(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // --- AKILLI BOYUTLANDIRMA (SQUOOSH MANTIĞI) ---
                // Resim 2000px'den genişse, oranını bozmadan küçült
                const MAX_WIDTH = 2000; 
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // Resmi canvas'a pürüzsüz bir şekilde çiz
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                // WebP'ye dönüştür (Kaliteyi 0.8'den 0.75'e çektik, fark edilmez ama boyut düşer)
                canvas.toBlob((blob) => {
                    const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                        type: 'image/webp'
                    });
                    
                    // TEST İÇİN KONSOLA YAZDIR (F12'den boyut farkını gör)
                    console.log(`🖼️ Orijinal: ${(file.size/1024/1024).toFixed(2)}MB | ✅ Optimize: ${(webpFile.size/1024).toFixed(2)}KB`);
                    
                    resolve(webpFile);
                }, 'image/webp', 0.75); 
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
    const result = await response.json();
    return result.data.url;
}

// --- GÖRSEL YÖNETİMİ ---
const renderImageManager = () => {
    const heroBox = document.getElementById("hero-manager");
    const galleryBox = document.getElementById("gallery-manager");
    const mockupGallery = document.getElementById("prev-gallery");
    const heroLabel = document.getElementById("hero-name-label");
    const galleryLabel = document.getElementById("gallery-names-label");

    heroBox.innerHTML = ""; galleryBox.innerHTML = ""; mockupGallery.innerHTML = "";
    
    if (newHeroFile || currentHeroUrl) {
        const src = newHeroFile ? URL.createObjectURL(newHeroFile) : currentHeroUrl;
        heroBox.innerHTML = `<div class="img-slot"><img src="${src}"></div>`;
        document.getElementById("prev-hero").src = src;
        heroLabel.innerHTML = newHeroFile ? `<small>Yeni: ${newHeroFile.name}</small>` : "";
    }

    existingGalleryUrls.forEach((url, i) => {
        galleryBox.innerHTML += `<div class="img-slot"><img src="${url}"><button type="button" class="remove-btn" onclick="window.removeExisting(${i})">×</button></div>`;
        mockupGallery.innerHTML += `<img src="${url}">`;
    });

    newGalleryFiles.forEach((file, i) => {
        const url = URL.createObjectURL(file);
        galleryBox.innerHTML += `<div class="img-slot"><img src="${url}"><button type="button" class="remove-btn" onclick="window.removeNew(${i})">×</button></div>`;
        mockupGallery.innerHTML += `<img src="${url}">`;
    });
    galleryLabel.innerHTML = newGalleryFiles.length > 0 ? `<small>${newGalleryFiles.length} Yeni Dosya Seçildi</small>` : "";
};

window.removeExisting = (i) => { existingGalleryUrls.splice(i, 1); renderImageManager(); };
window.removeNew = (i) => { newGalleryFiles.splice(i, 1); renderImageManager(); };

document.getElementById("p-hero-img").addEventListener("change", (e) => { newHeroFile = e.target.files[0]; renderImageManager(); });
document.getElementById("p-gallery-imgs").addEventListener("change", (e) => { 
    newGalleryFiles = [...newGalleryFiles, ...Array.from(e.target.files)];
    renderImageManager(); 
});

// --- MOCKUP TEXTS ---
const updatePreview = () => {
    document.getElementById("prev-title").innerText = document.getElementById("p-title").value || "Proje Başlığı";
    document.getElementById("prev-cat").innerText = document.getElementById("p-category").value;
    document.getElementById("prev-lead").innerText = document.getElementById("p-lead").value || "Açıklama...";
    const area = document.getElementById("p-area").value;
    document.getElementById("prev-meta").innerText = `${document.getElementById("p-location").value || 'Konum'} • ${document.getElementById("p-year").value || 'Yıl'} • ${area ? area + ' m²' : 'Alan'}`;
};
["p-title", "p-category", "p-lead", "p-location", "p-year", "p-area"].forEach(id => document.getElementById(id).addEventListener("input", updatePreview));

// --- MATRIX LOGIC ---
const pendingUser = sessionStorage.getItem("pendingUser");
if (!pendingUser && sessionStorage.getItem("adminLoggedIn") !== "true") window.location.href = "index.html";

const runMatrix = () => {
    const l1 = document.getElementById("matrix-line1");
    const l2 = document.getElementById("matrix-line2");
    l1.innerText = "> SİSTEM TARANIYOR...";
    setTimeout(() => {
        l2.innerText = `> HOŞ GELDİN AJAN: [${pendingUser?.toUpperCase() || 'BİLİNMEYEN'}]`;
        document.getElementById("pass-area").style.display = "block";
        document.getElementById("admin-pass").focus();
    }, 1000);
};

document.getElementById("admin-pass")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        if (e.target.value === "akare2025") {
            document.getElementById("matrix-overlay").style.display = "none";
            sessionStorage.setItem("adminLoggedIn", "true");
        } else {
            document.getElementById("matrix-error").style.display = "block";
        }
    }
});

if (sessionStorage.getItem("adminLoggedIn") === "true") document.getElementById("matrix-overlay").style.display = "none";
else runMatrix();

// --- LIST & SUBMIT ---
async function loadList() {
    const listDiv = document.getElementById("admin-project-list");
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    let fHTML = `<span class="list-section-title">⭐ VİTRİN</span>`, oHTML = `<span class="list-section-title">📂 TÜMÜ</span>`, fCount = 0;
    snap.forEach(d => {
        const p = d.data();
        const item = `<div class="project-item ${p.isFeatured ? 'is-featured' : ''}">
            <div class="item-main"><b>${p.title}</b><span>${p.category}</span></div>
            <div class="item-actions">
                <button class="btn-mini btn-mini-star" onclick="window.toggleFeatured('${d.id}', ${p.isFeatured})"><i class="${p.isFeatured?'fas':'far'} fa-star"></i></button>
                <button class="btn-mini btn-mini-edit" onclick="window.editProject('${d.id}')"><i class="fa fa-edit"></i></button>
                <button class="btn-mini btn-mini-delete" onclick="window.deleteProject('${d.id}')"><i class="fa fa-trash"></i></button>
            </div></div>`;
        if(p.isFeatured) { fHTML += item; fCount++; } else oHTML += item;
    });
    listDiv.innerHTML = fHTML + oHTML;
    document.getElementById("p-featured").disabled = (fCount >= 3 && !document.getElementById("p-featured").checked);
}

window.editProject = async (id) => {
    const docSnap = await getDoc(doc(db, "projects", id));
    if (docSnap.exists()) {
        const p = docSnap.data();
        document.getElementById("editing-id").value = id;
        document.getElementById("p-title").value = p.title;
        document.getElementById("p-category").value = p.category;
        document.getElementById("p-year").value = p.year;
        document.getElementById("p-location").value = p.location;
        document.getElementById("p-area").value = p.area;
        document.getElementById("p-lead").value = p.lead;
        document.getElementById("p-featured").checked = p.isFeatured;
        currentHeroUrl = p.heroImage; existingGalleryUrls = [...p.gallery];
        newHeroFile = null; newGalleryFiles = [];
        document.getElementById("form-mode-title").innerText = "Düzenle";
        document.getElementById("submit-btn").innerText = "GÜNCELLE";
        document.getElementById("cancel-btn").style.display = "block";
        renderImageManager(); updatePreview();
        window.scrollTo(0,0);
    }
};

window.cancelEdit = () => {
    document.getElementById("projectForm").reset();
    document.getElementById("editing-id").value = "";
    currentHeroUrl = ""; newHeroFile = null; existingGalleryUrls = []; newGalleryFiles = [];
    document.getElementById("form-mode-title").innerText = "Yeni Proje";
    document.getElementById("submit-btn").innerText = "YAYINLA";
    document.getElementById("cancel-btn").style.display = "none";
    document.getElementById("prev-hero").src = "https://via.placeholder.com/200x130?text=Kapak";
    document.getElementById("hero-name-label").innerHTML = "";
    document.getElementById("gallery-names-label").innerHTML = "";
    renderImageManager(); updatePreview();
};

document.getElementById("projectForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const st = document.getElementById("status");
    const editId = document.getElementById("editing-id").value;
    st.innerHTML = "⌛ İşleniyor ve WebP'ye dönüştürülüyor...";
    try {
        let finalHero = currentHeroUrl;
        if (newHeroFile) finalHero = await uploadToImgBB(await convertToWebP(newHeroFile));
        const uploaded = [];
        for (let f of newGalleryFiles) uploaded.push(await uploadToImgBB(await convertToWebP(f)));
        const finalGallery = [...existingGalleryUrls, ...uploaded];

        const data = {
            title: document.getElementById("p-title").value,
            category: document.getElementById("p-category").value,
            year: document.getElementById("p-year").value,
            location: document.getElementById("p-location").value,
            area: document.getElementById("p-area").value,
            lead: document.getElementById("p-lead").value,
            heroImage: finalHero,
            gallery: finalGallery,
            isFeatured: document.getElementById("p-featured").checked,
            createdAt: new Date()
        };

        if (editId) await updateDoc(doc(db, "projects", editId), data);
        else await addDoc(collection(db, "projects"), data);

        st.innerHTML = "✅ Tamamlandı!";
        setTimeout(() => { window.cancelEdit(); loadList(); st.innerHTML = ""; }, 1500);
    } catch (err) { st.innerHTML = "❌ Hata!"; }
});

window.toggleFeatured = async (id, stat) => {
    const q = await getDocs(collection(db, "projects"));
    let c = 0; q.forEach(d => { if(d.data().isFeatured) c++; });
    if (!stat && c >= 3) { alert("Vitrinde en fazla 3 proje olabilir!"); return; }
    await updateDoc(doc(db, "projects", id), { isFeatured: !stat }); loadList();
};

window.deleteProject = async (id) => { if (confirm("Silinsin mi?")) { await deleteDoc(doc(db, "projects", id)); loadList(); } };

window.adminLogout = () => { if(confirm("Çıkış?")) { sessionStorage.clear(); window.location.href = "index.html"; } };

window.switchTab = (n, b) => {
    document.body.classList.remove('tab-form', 'tab-list');
    document.body.classList.add(`tab-${n}`);
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    b.classList.add('active');
    window.scrollTo(0,0);
};

loadList();
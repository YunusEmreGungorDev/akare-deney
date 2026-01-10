/* --- AKARE MİMARLIK | MAIN JS (CLEAN VERSION) --- */
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.projects = {}; 
document.body.classList.add("js-enabled");

// --- ANIMASYON MOTORLARI ---
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target); 
        }
    });
}, { threshold: 0.1 });

const mobileObserver = new IntersectionObserver((entries) => {
    if (window.innerWidth > 900) return;
    entries.forEach(entry => {
        entry.target.classList.toggle("mobile-active", entry.isIntersecting);
    });
}, { threshold: 0.55 });

window.initObservers = () => {
    const targets = document.querySelectorAll(".project-card-v4, .team-card, .service-card, .btn-magnetic, .reveal-on-scroll, .gallery-item, .project-row, .row-img-box img");
    targets.forEach(el => {
        revealObserver.observe(el);
        mobileObserver.observe(el);
    });
};
// --- FİLTRELEME DEĞİŞKENLERİ ---
let allProjects = []; 
let currentCategory = 'all';
let currentCity = 'all';
let currentDistrict = 'all';
let currentFilterMode = 'category';

const normalize = (val) => val ? val.toString().toLowerCase().replace(/İ/g, "i").replace(/I/g, "ı").trim() : "";

// --- ANA FİLTRELEME MOTORU ---
window.applyFilters = () => {
  const projectWrapper = document.getElementById("full-width-project-wrapper"); 
  const portfolioGrid = document.querySelector(".portfolio-grid"); 

  if (projectWrapper) {
    const filtered = allProjects.filter(p => {
        const matchesCat = currentCategory === 'all' || normalize(p.category) === normalize(currentCategory);
        const matchesCity = currentCity === 'all' || normalize(p.city) === normalize(currentCity);
        const matchesDist = currentDistrict === 'all' || normalize(p.district) === normalize(currentDistrict);
        return matchesCat && matchesCity && matchesDist;
    });

    filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    let html = "";
    filtered.forEach((p, index) => {
        const isEven = index % 2 === 0;
        const imageSrc = p.heroImage || 'https://placehold.co/1200x800?text=Gorsel+Yukleniyor';

        html += `
        <section class="${isEven ? 'project-section-white' : 'project-section-green'}" style="padding: 60px 0; overflow: hidden;">
            <div class="container">
                <div class="project-row ${isEven ? '' : 'reverse'}" 
                     style="display: flex; align-items: center; gap: 40px; flex-wrap: wrap;">
                    
                    <!-- METİN KUTUSU -->
                    <div class="row-text-box" style="flex: 1; min-width: 280px; max-width: 100%;">
                        <span class="row-cat" style="color: var(--accent); font-weight: 800; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; display: block;">
                            ${p.category}
                        </span>
                        <h2 class="row-title" style="font-size: clamp(1.5rem, 4vw, 2.2rem); line-height: 1.2; margin-bottom: 15px; font-weight: 800;">
                            ${p.title}
                        </h2>
                        <div class="row-info-meta" style="margin-bottom: 15px; display: flex; gap: 15px; font-size: 0.85rem; font-weight: 600; color: var(--accent); flex-wrap: wrap;">
                            <span><i class="fas fa-map-marker-alt"></i> ${p.district || '-'}, ${p.city || '-'}</span>
                            <span><i class="far fa-calendar-alt"></i> ${p.year}</span>
                        </div>
                        <div class="row-desc" style="font-size: 1rem; line-height: 1.6; margin-bottom: 25px; opacity: 0.8; max-width: 500px;">
                            ${p.lead}
                        </div>
                        <a href="proje-detay.html?proje=${p.slug}" class="view-details-btn">
                            PROJEYİ İNCELE <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                    
                    <!-- GÖRSEL KUTUSU -->
                    <div class="row-img-box" 
                         style="flex: 1.2; min-width: 280px; max-width: 100%; border-radius: 4px; overflow: hidden; box-shadow: 0 15px 30px rgba(0,0,0,0.1); cursor: pointer;"
                         onclick="window.location.href='proje-detay.html?proje=${p.slug}'">
                        <div class="img-inner-wrap" style="width: 100%; height: 100%; min-height: 300px; max-height: 500px;">
                            <img src="${imageSrc}" alt="${p.title}" 
                                 style="width: 100%; height: 100%; object-fit: cover; display: block;">
                        </div>
                    </div>
                </div>
            </div>
        </section>`;
    });
    
    projectWrapper.innerHTML = html || '<p style="text-align:center; padding:100px;">Eşleşen proje bulunamadı.</p>';
    if (window.initObservers) window.initObservers();
  }

  // ANA SAYFA (Aynen kalsın)
  if (portfolioGrid) {
    const featured = allProjects.filter(p => p.isFeatured === true).slice(0, 3);
    let html = "";
    featured.forEach(p => {
      html += `
        <div class="project-card-v4" onclick="window.location.href='proje-detay.html?proje=${p.slug}'">
          <div class="card-img-holder"><img src="${p.heroImage}" alt="${p.title}"></div>
          <div class="card-content">
            <span class="card-subtitle">${p.category}</span>
            <h3 class="card-heading">${p.title}</h3>
            <div class="card-view-details">PROJEYİ İNCELE</div>
          </div>
        </div>`;
    });
    portfolioGrid.innerHTML = html;
    if (window.initObservers) window.initObservers();
  }
};

window.switchFilterMode = (mode) => {
    currentFilterMode = mode;
    currentCategory = 'all'; currentCity = 'all'; currentDistrict = 'all'; 
    document.getElementById('mode-cat').classList.toggle('active', mode === 'category');
    document.getElementById('mode-loc').classList.toggle('active', mode === 'location');
    document.getElementById('sub-filter-wrapper').classList.remove('active');
    renderFilterButtons();
    window.applyFilters();
};

async function renderFilterButtons() {
    const wrapper = document.getElementById('dynamic-filter-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '<span style="color:white; opacity:0.5; font-size:0.8rem;">Yükleniyor...</span>';

    if (currentFilterMode === 'category') {
        const snap = await getDocs(collection(db, "categories"));
        let html = `<button class="filter-btn active" data-value="all" onclick="filterBy('category', 'all')">TÜMÜ</button>`;
        snap.forEach(d => {
            const name = d.data().name;
            html += `<button class="filter-btn" data-value="${name}" onclick="filterBy('category', '${name}')">${name}</button>`;
        });
        wrapper.innerHTML = html;
    } else {
        const snap = await getDocs(collection(db, "cities"));
        let html = `<button class="filter-btn active" data-value="all" onclick="handleCityClick('all', this)">TÜM ŞEHİRLER</button>`;
        snap.forEach(d => {
            const name = d.data().name;
            html += `<button class="filter-btn" data-value="${name}" onclick="handleCityClick('${name}', this)">${name}</button>`;
        });
        wrapper.innerHTML = html;
    }
}

window.filterBy = (type, value) => {
    if (type === 'category') currentCategory = value;
    if (type === 'district') currentDistrict = value;
    const btns = document.querySelectorAll(type === 'category' ? '#dynamic-filter-wrapper .filter-btn' : '#sub-filter-wrapper .filter-btn');
    btns.forEach(b => b.classList.toggle('active', b.getAttribute('data-value') === value));
    window.applyFilters();
};

window.handleCityClick = async (cityName, btn) => {
    currentCity = cityName; currentDistrict = 'all';
    document.querySelectorAll('#dynamic-filter-wrapper .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const sub = document.getElementById('sub-filter-wrapper');
    if (cityName === 'all') { sub.classList.remove('active'); window.applyFilters(); return; }

    const q = query(collection(db, "districts"), where("city", "==", cityName));
    const snap = await getDocs(q);
    let html = `<button class="filter-btn active" data-value="all" onclick="filterBy('district', 'all')">TÜMÜ (${cityName})</button>`;
    snap.forEach(d => { html += `<button class="filter-btn" data-value="${d.data().name}" onclick="filterBy('district', '${d.data().name}')">${d.data().name}</button>`; });
    sub.innerHTML = html; sub.classList.add('active');
    window.applyFilters();
};

// --- DOM READY KURULUMLARI ---
document.addEventListener("DOMContentLoaded", () => {
  if ("scrollRestoration" in history) { history.scrollRestoration = "manual"; }
  window.scrollTo(0, 0);

  const urlParams = new URLSearchParams(window.location.search);
  const projectSlug = urlParams.get("proje");

  if (window.isDetailPage && projectSlug) {
      loadSingleProject(projectSlug);
  } else {
      loadFirebaseData();
  }

  // Preloader
  const preloaderStartTime = Date.now();
  window.hidePreloader = function () {
    const currentTime = Date.now();
    const elapsed = currentTime - preloaderStartTime;
    const minDuration = 1500;
    setTimeout(() => {
      document.body.classList.add("loaded");
    }, Math.max(0, minDuration - elapsed));
  };
  window.addEventListener("load", hidePreloader);

  // Lightbox & Scroll Setup
  if (typeof Lenis !== "undefined") {
    const lenis = new Lenis({ duration: 1.2, smooth: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.lenis = lenis;
  }

  // Header & Scroll Events
  const header = document.querySelector("header");
  let lastScrollTop = 0;
  window.addEventListener("scroll", () => {
    let scrollTop = window.scrollY;
    header.classList.toggle("scrolled", scrollTop > 50);
    const mobileNav = document.getElementById("mobile-nav");
    if (mobileNav && !mobileNav.classList.contains("active")) {
      if (scrollTop > lastScrollTop && scrollTop > 200) header.classList.add("header-hidden");
      else header.classList.remove("header-hidden");
    }
    lastScrollTop = Math.max(0, scrollTop);

    const btn = document.getElementById("scrollTopBtn");
    if (btn) btn.classList.toggle("show", window.scrollY > 500);
    
    const mScrollBtn = document.getElementById("mScrollTopBtn");
    if (mScrollBtn) mScrollBtn.style.display = (window.scrollY > 500) ? "flex" : "none";
  });

  // Navigation Click Handlers
  document.addEventListener("click", (e) => {
    if (e.target.closest("#scrollTopBtn") || e.target.closest("#mScrollTopBtn")) {
      e.preventDefault();
      if (window.lenis) window.lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // Map Interaction
  const mapContainer = document.querySelector(".map-container-wrapper");
  if (mapContainer) {
    mapContainer.addEventListener("click", () => mapContainer.classList.add("active"));
    mapContainer.addEventListener("mouseleave", () => mapContainer.classList.remove("active"));
  }

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.closeLightbox();
    if (window.lightboxSwiper) {
      if (e.key === "ArrowRight") window.lightboxSwiper.slideNext();
      if (e.key === "ArrowLeft") window.lightboxSwiper.slidePrev();
    }
  });

  /* --- SIDE NAV - AKILLI TAKİP SİSTEMİ (FIXED) --- */
  const sideNavElement = document.getElementById("side-nav");
  if (sideNavElement) {
      const trackedSections = document.querySelectorAll("section[id]");
      const navLinks = document.querySelectorAll(".side-link");
      const sideNavObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
              if (entry.isIntersecting) {
                  const id = entry.target.getAttribute("id");
                  navLinks.forEach((link) => {
                      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
                  });
              }
          });
      }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
      trackedSections.forEach((section) => sideNavObserver.observe(section));
  }

  // Mobile Comm Toggle
  window.toggleMobileComm = () => document.getElementById("mobileCommWrapper").classList.toggle("active");
  document.addEventListener("mousedown", (e) => {
    const wrapper = document.getElementById("mobileCommWrapper");
    if (wrapper && !wrapper.contains(e.target)) wrapper.classList.remove("active");
  });
});

// --- LIGHTBOX AÇMA FONKSİYONU ---
window.openLightbox = function (projectId, startIndex = 0) {
  const project = window.projects[projectId];
  if (!project) return;
  const lightbox = document.getElementById("project-lightbox");
  const wrapper = document.getElementById("swiper-wrapper");

  if (window.lightboxSwiper) window.lightboxSwiper.destroy(true, true);
  wrapper.innerHTML = "";
  
  // Kapak fotoğrafı + Galeri fotoğraflarını birleştiriyoruz
  const allImages = [project.heroImage, ...(project.gallery || [])];

  allImages.forEach((imgSrc) => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.innerHTML = `<div class="swiper-zoom-container"><img src="${imgSrc}"></div>`;
    wrapper.appendChild(slide);
  });

  document.getElementById("lb-title").textContent = project.title;
  document.getElementById("lb-category").textContent = project.category;
  document.getElementById("lb-details").textContent = `${project.district} • ${project.year}`;
  const counter = document.getElementById("lb-counter");
  
  // İlk yüklemede sayacı doğru göstermek için
  counter.textContent = `${startIndex + 1} / ${allImages.length}`;

  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    window.lightboxSwiper = new Swiper(".mySwiper", {
      initialSlide: startIndex, 
      slidesPerView: 1,
      speed: 800,
      grabCursor: true,
      zoom: { maxRatio: 3, minRatio: 1 },
      keyboard: { enabled: true },
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
      on: { 
        slideChange: function () { 
          // Sayacı her kaydırmada güncelle
          counter.textContent = `${this.realIndex + 1} / ${allImages.length}`; 
        } 
      }
    });
  }, 50);
};

window.closeLightbox = () => {
  document.getElementById("project-lightbox").classList.remove("active");
  document.body.style.overflow = "";
};

// --- MOBİL MENÜ ---
window.toggleMenu = () => {
  const header = document.querySelector("header");
  const mobileNav = document.getElementById("mobile-nav");
  const menuBtn = document.querySelector(".menu-btn");
  const isActive = mobileNav.classList.toggle("active");
  menuBtn.classList.toggle("open");
  header.classList.toggle("menu-open", isActive);
  document.body.style.overflow = isActive ? "hidden" : "";
  mobileNav.style.visibility = isActive ? "visible" : "hidden";
};

window.toggleAccordion = () => document.getElementById("home-accordion").classList.toggle("open");

// --- VERİ YÜKLEME ---
async function loadFirebaseData() {
  try {
    const snap = await getDocs(collection(db, "projects"));
    allProjects = []; 
    snap.forEach((doc) => allProjects.push({ id: doc.id, ...doc.data() }));
    renderFilterButtons();
    window.applyFilters();
    await loadTeamData();
    window.initObservers();
    if (window.hidePreloader) window.hidePreloader();
  } catch (error) { console.error("Veri çekme hatası:", error); }
}

async function loadSingleProject(slug) {
  try {
    const q = query(collection(db, "projects"), where("slug", "==", slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const p = docSnap.data();
      const projectId = docSnap.id;
      window.projects[projectId] = p;
      document.title = `${p.seoTitle || p.title} | AKARE`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", (p.lead || p.story).substring(0, 160));

      const heroBg = document.getElementById("det-hero-bg");
      if (heroBg) heroBg.style.backgroundImage = `url('${p.heroImage}')`;
      document.getElementById("det-title").innerText = p.title;
      document.getElementById("det-year-loc").innerText = `${p.district} / ${p.year}`;
      document.getElementById("det-location").innerText = p.district;
      document.getElementById("det-area").innerText = p.area + " m²";
      document.getElementById("det-category").innerText = p.category;
      document.getElementById("det-year").innerText = p.year;
document.getElementById("det-lead").innerHTML = (p.story || "").replace(/\n/g, "<br>");
      renderEditorialGallery(p, projectId);
    }
  } catch (e) { console.error(e); }
  if (window.hidePreloader) window.hidePreloader();
}

async function loadTeamData() {
    const teamWrapper = document.getElementById("teamScrollArea");
    const dotsWrapper = document.querySelector(".team-dots-wrapper");
    if (!teamWrapper) return;
    try {
        const snap = await getDocs(collection(db, "team"));
        let teamHtml = ""; let dotsHtml = ""; let index = 0;
        snap.forEach(doc => {
            const m = doc.data();
            teamHtml += `<div class="team-card"><div class="team-img-box"><img src="${m.image}"></div><h3 class="team-name">${m.name}</h3><span class="team-role">${m.role}</span></div>`;
            dotsHtml += `<div class="t-dot ${index === 0 ? 'active' : ''}"></div>`;
            index++;
        });
        teamWrapper.innerHTML = teamHtml;
        if (dotsWrapper) dotsWrapper.innerHTML = dotsHtml;
        initTeamScrollObserver(); 
    } catch (e) { console.error(e); }
}

function initTeamScrollObserver() {
    const teamGrid = document.getElementById("teamScrollArea");
    const teamDots = document.querySelectorAll(".t-dot");
    if (teamGrid && teamDots.length > 0) {
        teamGrid.addEventListener("scroll", () => {
            const activeIndex = Math.round(teamGrid.scrollLeft / teamGrid.clientWidth);
            teamDots.forEach((dot, index) => dot.classList.toggle("active", index === activeIndex));
        }, { passive: true });
    }
}

// --- EDİTORYAL GALERİ RENDER (RESİM SIRALAMASI DAHİL) ---
function renderEditorialGallery(project, id) {
  const galleryDiv = document.getElementById("editorial-gallery");
  if (!galleryDiv || !project.gallery) return;
  galleryDiv.innerHTML = "";

  project.gallery.forEach((imgSrc, index) => {
    const sizeClass = (index % 3 === 0) ? "large" : "small";
    const item = document.createElement("div");
    item.className = `gallery-item ${sizeClass} reveal-on-scroll`;
    
    // Lightbox'ı açarken index + 1 gönderiyoruz çünkü Kapak Fotoğrafı index 0 olacak.
    item.onclick = () => window.openLightbox(id, index + 1);

    item.innerHTML = `
      <img src="${imgSrc}" loading="lazy">
      <div class="gallery-hover-info">
        <i class="fas fa-search-plus"></i>
        <span>TAM EKRAN GÖR</span>
      </div>
    `;
    galleryDiv.appendChild(item);
  });
  window.initObservers();
}


// --- GİZLİ ADMİN GİRİŞİ (EASTER EGG) ---
let adminTimer;
document.addEventListener('mousedown', startAdminTimer);
document.addEventListener('touchstart', startAdminTimer);
document.addEventListener('mouseup', clearAdminTimer);
document.addEventListener('mouseleave', clearAdminTimer);
document.addEventListener('touchend', clearAdminTimer);

function startAdminTimer(e) {
    if (e.target.closest('.team-card')) {
        adminTimer = setTimeout(() => { window.location.href = 'admin.html'; }, 4000);
    }
}
function clearAdminTimer() { clearTimeout(adminTimer); }

window.openCustomChat = () => {
  if (typeof $crisp !== "undefined") {
    $crisp.push(["do", "chat:show"]);
    $crisp.push(["do", "chat:open"]);
  }
};

// --- SLAYT ---
function startHeroSlider() {
  const slides = document.querySelectorAll(".slide");
  if (slides.length === 0) return;
  let currentSlide = 0;
  setInterval(() => {
    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add("active");
  }, 5000);
}

document.querySelectorAll('.s-accordion-header').forEach(header => {
    header.addEventListener('click', () => header.parentElement.classList.toggle('active'));
});

startHeroSlider();
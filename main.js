/* --- AKARE MİMARLIK | MAIN JS (NO JUMP FIX) --- */

import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Global değişkeni Firebase'e hazırlayalım
window.projects = {};

document.addEventListener("DOMContentLoaded", () => {
    
    // SAYFA YENİLENİNCE EN ÜSTE AL (Tarayıcı hafızasını ez)
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    /* 1. PRELOADER */
    const preloaderStartTime = Date.now();
    window.hidePreloader = function() {
        const currentTime = Date.now();
        const elapsed = currentTime - preloaderStartTime;
        const minDuration = 1500; 
        const remainingTime = Math.max(0, minDuration - elapsed);

        setTimeout(() => {
            document.body.classList.add('loaded');
            const stickyBar = document.querySelector('.sticky-action-bar');
            if(stickyBar) stickyBar.classList.add('visible');
            

        }, remainingTime);
    }
    window.addEventListener('load', hidePreloader);
    setTimeout(() => { if(!document.body.classList.contains('loaded')) hidePreloader(); }, 3000);





    /* 3. SWIPER LIGHTBOX (GALERİ İÇİN) */
    let lightboxSwiper = null;
window.openLightbox = function(projectId) {
    
    if (typeof projects === 'undefined' || !projects[projectId]) return;
    const project = projects[projectId];
    const lightbox = document.getElementById('project-lightbox');
    const wrapper = document.getElementById('swiper-wrapper');
    
    // Eski swiper varsa yok et
    if (lightboxSwiper !== null) { lightboxSwiper.destroy(true, true); lightboxSwiper = null; }

    wrapper.innerHTML = '';
    const allImages = [project.heroImage, ...project.gallery];
    
    // Resimleri ekle
    allImages.forEach(imgSrc => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `<div class="swiper-zoom-container"><img src="${imgSrc}" alt="${project.title}"></div>`;
        wrapper.appendChild(slide);
    });

// Yazıları Doldur
document.getElementById('lb-title').textContent = project.title;
document.getElementById('lb-category').textContent = project.category;
document.getElementById('lb-details').textContent = `${project.location}  •  ${project.year}  •  ${project.area}`;

// Mobilde galeriyi açınca en başa sarmasını sağla
if(window.innerWidth < 768) {
    document.querySelector('.lightbox-footer').scrollTop = 0;
}
    
    // Sayacı sıfırla
    const counter = document.getElementById('lb-counter');
    counter.textContent = `1 / ${allImages.length}`;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        lightboxSwiper = new Swiper('.mySwiper', {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: true,
            speed: 800,
            grabCursor: true,
            zoom: true,
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            // PAGINATION (NOKTALAR) SİLİNDİ
            on: {
                slideChange: function () {
                    // Sayacı Güncelle (Döngü olduğu için realIndex kullanıyoruz)
                    counter.textContent = `${this.realIndex + 1} / ${allImages.length}`;
                }
            }
        });
    }, 10);

     if (typeof $crisp !== 'undefined') {
        $crisp.push(['do', 'chat:hide']);
    }
};

    window.closeLightbox = function() {
        document.getElementById('project-lightbox').classList.remove('active');
        document.body.style.overflow = '';
        if (lightboxSwiper !== null) { lightboxSwiper.destroy(true, true); lightboxSwiper = null; }
        if (typeof $crisp !== 'undefined') {

    }
    };


    /* 4. MOBİL SCROLL ANIMASYONLARI (Hover Efekti) */
    const mobileObserver = new IntersectionObserver((entries) => {
        if (window.innerWidth > 900) return;
        entries.forEach(entry => {
            // Threshold'u biraz düşürdük, daha kolay tetiklensin
            if (entry.isIntersecting) {
                entry.target.classList.add('mobile-active');
            } else {
                entry.target.classList.remove('mobile-active');
            }
        });
    }, { threshold: 0.55, rootMargin: "0px" });

window.initObservers = function() {
    // mobileObserver'ın tanımlı olduğundan emin olmalıyız
    if (typeof mobileObserver !== 'undefined') {
        const elements = document.querySelectorAll('.project-card-v4, .team-card');
        elements.forEach(el => mobileObserver.observe(el));
    }
}

// Fonksiyonu çalıştırırken de window üzerinden çağırıyoruz
window.initObservers();


    /* 5. GENEL FONKSİYONLAR */
    const header = document.querySelector('header');
    const mobileNav = document.getElementById('mobile-nav');
    const menuBtn = document.querySelector('.menu-btn');
    const scrollBtn = document.getElementById('scrollTopBtn');
    let lastScrollTop = 0;

    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({ duration: 1.2, smooth: true });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        window.lenis = lenis;
    }
    
    window.addEventListener('scroll', () => {
    let scrollTop = window.scrollY || document.documentElement.scrollTop;

    // 1. Renk Değişimi: Sayfa en tepedeyse şeffaf, 50px aşağıdaysa beyaz arka plan
    if (scrollTop > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    // 2. Gizlenme/Görünme: Aşağı inerken sakla, yukarı çıkarken göster
    // (Mobil menü açıkken header kaybolmamalı)
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav && !mobileNav.classList.contains('active')) {
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
    }

    lastScrollTop = Math.max(0, scrollTop);
});

// Scroll İzleme (Sadece Scroll Top Butonu İçin)
    window.addEventListener('scroll', () => {
        const mScrollBtn = document.getElementById('mScrollTopBtn');
        if (mScrollBtn) {
            // Sayfa 500px aşağı inince butonu menüden bağımsız olarak göster
            if (window.scrollY > 500) {
                mScrollBtn.style.setProperty('display', 'flex', 'important');
            } else {
                mScrollBtn.style.setProperty('display', 'none', 'important');
            }
        }
    });

    // Yukarı Çık (Lenis Fix)
    if(scrollBtn) {
        scrollBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.lenis) window.lenis.scrollTo(0); 
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Mobil Menü
    window.toggleMenu = function() {
        if (!menuBtn || !mobileNav) return;
        const isActive = mobileNav.classList.toggle('active');
        menuBtn.classList.toggle('open');
        
        if (isActive) { 
            header.classList.add('menu-open');
            document.body.style.overflow = 'hidden'; 
            header.classList.remove('header-hidden'); 
            mobileNav.style.visibility = 'visible'; 
        } else { 
            header.classList.remove('menu-open');
            document.body.style.overflow = ''; 
            setTimeout(() => { if(!mobileNav.classList.contains('active')) mobileNav.style.visibility = 'hidden'; }, 400); 
        }
    };
    
    window.toggleAccordion = function() { document.getElementById('home-accordion').classList.toggle('open'); };
    document.querySelectorAll('#mobile-nav a').forEach(link => { link.addEventListener('click', () => { if(!link.classList.contains('mobile-group-header')) window.toggleMenu(); }); });

    // Reveal Animation
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll').forEach(section => revealObserver.observe(section));

    // Proje Render
    const projectsWrapper = document.getElementById('full-width-project-wrapper');

    window.filterProjects = function(category) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if(btn.textContent.trim() === category || (category === 'all' && btn.textContent === 'TÜMÜ')) btn.classList.add('active');
        });
        renderProjects(category);
    };

window.renderProjects = function(filterCategory = 'all') {
    // 1. Hedef Alanları Tanımla
    const projectsWrapper = document.getElementById('full-width-project-wrapper'); // Projeler Sayfası
    const portfolioGrid = document.querySelector('.portfolio-grid'); // Ana Sayfa Grid Alanı

    // 2. Veri Kontrolü
    if (!window.projects || Object.keys(window.projects).length === 0) {
        console.warn("Henüz yüklenecek proje verisi yok.");
        return;
    }

    const keys = Object.keys(window.projects);
    let fullHTML = '';
    let displayIndex = 0;

    // 3. Projeleri Dön ve HTML Oluştur
    keys.forEach((key) => {
        const p = window.projects[key];
        
        // Filtreleme Mantığı
        let isMatch = (filterCategory === 'all') ? true : p.category.toUpperCase().includes(filterCategory.toUpperCase());
        
        if (isMatch) {
            const isEven = displayIndex % 2 === 0;
            const sectionClass = isEven ? 'project-section-white' : 'project-section-green';
            const rowClass = isEven ? '' : 'reverse';
            
            // Projeler Sayfası İçin Zig-Zag Satır Yapısı
// main.js içindeki döngü kısmını şu şekilde revize et:

            fullHTML += `
                <section class="${sectionClass} reveal-on-scroll">
                    <div class="container">
                        <div class="project-row ${rowClass}">
                            <div class="row-text-box">
                                <span class="row-cat">${p.category}</span>
                                <h2 class="row-title">${p.title}</h2>
                                
                                <!-- YENİ: TEKNİK BİLGİ SATIRI -->
                                <div class="row-info-meta">
                                    <span><i class="fas fa-map-marker-alt"></i> ${p.location}</span>
                                    <span><i class="far fa-calendar-alt"></i> ${p.year}</span>
                                    <span><i class="fas fa-ruler-combined"></i> ${p.area} m²</span>
                                </div>

                                <div class="row-desc">${p.lead}</div>
                                
                                <!-- BUTON KALDIRILDI -->
                            </div>
                            <div class="row-img-box project-card-v4" onclick="window.openLightbox('${key}')">
                                <div class="card-img-holder">
                                    <img src="${p.heroImage}" alt="${p.title}" loading="lazy">
                                </div>
                                <div class="project-card-content-overlay">
                                    <i class="fas fa-images overlay-icon"></i>
                                    <span class="overlay-text">GALERİYİ İNCELE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>`;
            displayIndex++;
        }
    });

    // 4. Ekrana Basma Mantığı (Projeler Sayfası)
    if (projectsWrapper) {
        projectsWrapper.innerHTML = fullHTML || '<div style="text-align:center; padding: 50px;">Eşleşen proje bulunamadı.</div>';
    }

    // 5. Ekrana Basma Mantığı (Ana Sayfa - Sadece ilk 3 proje)
    if (portfolioGrid && filterCategory === 'all') {
        let gridHTML = '';
        keys.slice(0, 3).forEach(key => { // Sadece ilk 3 tanesini al
            const p = window.projects[key];
            gridHTML += `
                <div class="project-card-v4 reveal-on-scroll" onclick="window.openLightbox('${key}')">
                    <div class="card-img-holder"><img src="${p.heroImage}" alt="${p.title}"></div>
                    <div class="card-content">
                        <span class="card-subtitle">${p.category}</span>
                        <h3 class="card-heading">${p.title}</h3>
                    </div>
                </div>`;
        });
        portfolioGrid.innerHTML = gridHTML;
    }

    // 6. Animasyonları ve Observer'ları Yeniden Başlat
    setTimeout(() => {
        // Yeni eklenen elemanları görünürlük testine sok
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));
        
        // Mobil hover/scroll efektini başlat
        if (window.initObservers) window.initObservers();
    }, 100);
};

    const mapContainer = document.querySelector('.map-container-wrapper');
    if(mapContainer) {
        mapContainer.addEventListener('click', function() { this.classList.add('active'); });
        mapContainer.addEventListener('mouseleave', function() { this.classList.remove('active'); });
    }

    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape') window.closeLightbox();
        if(lightboxSwiper) {
            if(e.key === 'ArrowRight') lightboxSwiper.slideNext();
            if(e.key === 'ArrowLeft') lightboxSwiper.slidePrev();
        }
    });

    
    /* =================================================================
       6. EKSİK PARÇALAR (SIDE NAV & TEAM DOTS) - YENİ EKLENDİ
       ================================================================= */

    // A. TEAM DOTS (Mobilde Noktaları Yönetme)
    const teamGrid = document.getElementById('teamScrollArea');
    const teamDots = document.querySelectorAll('.t-dot');

    if (teamGrid && teamDots.length > 0) {
        teamGrid.addEventListener('scroll', () => {
            const scrollLeft = teamGrid.scrollLeft;
            const width = teamGrid.clientWidth;
            // Hangi slayttayız? (Yuvarlama yaparak bul)
            const activeIndex = Math.round(scrollLeft / width);

            teamDots.forEach((dot, index) => {
                if (index === activeIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }, { passive: true });
    }

   /* --- SIDE NAV - KESİN ÇÖZÜM --- */
    const trackedSections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.side-link');

    const sideNavOptions = {
        // rootMargin: Ekranın tam ortasında hayali bir çizgi oluşturur
        // Üstten %45, alttan %45 yer kaplar, sadece %10'luk orta alanı izler.
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0 
    };

    const sideNavObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, sideNavOptions);
    /* --- YENİ İLETİŞİM SİSTEMİ MANTIĞI --- */

window.toggleCommMenu = function() {
    const wrapper = document.getElementById('commWrapper');
    wrapper.classList.toggle('active');
    
    // Menü açılınca alttaki 'Projenizi Konuşalım' baloncuğunu gizle
    const tooltip = document.getElementById('commTooltip');
    if(tooltip) tooltip.classList.remove('visible');
};
/* --- CANLI DESTEK BUTONU TETİKLEYİCİSİ --- */
window.openCustomChat = function() {
    if (typeof $crisp !== 'undefined') {
        $crisp.push(['do', 'chat:show']); // Crisp balonunu göster
        $crisp.push(['do', 'chat:open']); // Sohbet penceresini aç
        
        // Bizim açılır menü (WhatsApp/Telefon ikonları) açıksa onu kapat
        const wrapper = document.getElementById('commWrapper');
        if (wrapper) wrapper.classList.remove('active');
    }
};

// Sayfa yüklendikten 5 saniye sonra teklif balonunu göster, 4 saniye sonra geri gizle
window.addEventListener('load', () => {
    // Crisp'i başlangıçta gizle
    if (typeof $crisp !== 'undefined') {
        $crisp.push(['do', 'chat:hide']);
    }

    setTimeout(() => {
        const tooltip = document.getElementById('commTooltip');
        const wrapper = document.getElementById('commWrapper');
        
        // Sadece menü kapalıysa göster
        if (!wrapper.classList.contains('active')) {
            tooltip.classList.add('visible');
            setTimeout(() => {
                tooltip.classList.remove('visible');
            }, 5000); // 5 saniye boyunca ekranda kalır
        }
    }, 4000); // Sayfa açıldıktan 4 saniye sonra çıkar
});
// Crisp penceresi kullanıcı tarafından kapatıldığında (küçültüldüğünde)
if (typeof $crisp !== 'undefined') {
    $crisp.push(["on", "chat:closed", function() {
        // Sohbet kapatılınca Crisp'i tamamen gizle
        $crisp.push(['do', 'chat:hide']);
    }]);
}   

/* --- CRISP VE BUTON KONTROLÜ (MASAÜSTÜ OPTİMİZE) --- */
if (typeof $crisp !== 'undefined') {

    $crisp.push(["on", "chat:opened", function() {
        // Crisp açılınca sadece ANA BUTONU gizle
        const mainBtn = document.getElementById('commMainBtn');
        if (mainBtn) mainBtn.classList.add('comm-hidden');
    }]);

    $crisp.push(["on", "chat:closed", function() {
        // Crisp kapanınca ANA BUTONU geri getir, Crisp'i gizle
        const mainBtn = document.getElementById('commMainBtn');
        if (mainBtn) mainBtn.classList.remove('comm-hidden');
        $crisp.push(['do', 'chat:hide']);
    }]);
}

// Menü açma fonksiyonu (Aynı kalabilir)
window.toggleCommMenu = function() {
    const wrapper = document.getElementById('commWrapper');
    wrapper.classList.toggle('active');
    const tooltip = document.getElementById('commTooltip');
    if(tooltip) tooltip.classList.remove('visible');
};

// Yukarı çıkma fonksiyonu (Aynı kalabilir)
window.scrollToTop = function(e) {
    if (e) e.preventDefault();
    if (window.lenis) window.lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- YUKARI ÇIK BUTONU ÇALIŞTIRMA KODU ---
document.addEventListener('click', function(e) {
    // Eğer tıklanan eleman scrollTopBtn ise veya içindeki ikon ise
    if (e.target.closest('#scrollTopBtn')) {
        e.preventDefault();
        
        // Önce Lenis (smooth scroll) var mı bak, varsa onu kullan
        if (window.lenis) {
            window.lenis.scrollTo(0);
        } else {
            // Yoksa normal tarayıcı scroll'unu kullan
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});

// Sayfa kaydırıldığında butonu göster/gizle
window.addEventListener('scroll', function() {
    const btn = document.getElementById('scrollTopBtn');
    if (btn) {
        if (window.scrollY > 500) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    }
});

/* --- MOBİL AKILLI MENÜ SİSTEMİ --- */

window.toggleMobileComm = function() {
    document.getElementById('mobileCommWrapper').classList.toggle('active');
};

// Scroll Top Tıklama
document.addEventListener('click', (e) => {
    if (e.target.closest('#mScrollTopBtn')) {
        e.preventDefault();
        if (window.lenis) window.lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
// Menü dışına tıklandığında kapatma
document.addEventListener('mousedown', (e) => {
    const wrapper = document.getElementById('mobileCommWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        wrapper.classList.remove('active');
    }
});


// SAYFA YÜKLENDİĞİNDE VERİLERİ ÇEKMEYE BAŞLA
document.addEventListener("DOMContentLoaded", () => {
    loadFirebaseData();
});
    trackedSections.forEach(section => sideNavObserver.observe(section));
});

async function loadFirebaseData() {
    try {
        console.log("Veriler çekiliyor...");
        // orderBy yerine direkt collection alalım, tarih hatası listeyi bozmasın
        const querySnapshot = await getDocs(collection(db, "projects"));
        
        window.projects = {}; 
        querySnapshot.forEach((doc) => {
            window.projects[doc.id] = doc.data();
        });

        // Veri geldiyse sayfayı doldur
        if (typeof window.renderProjects === "function") {
            window.renderProjects('all');
        }
        
        if (window.hidePreloader) window.hidePreloader();

    } catch (error) {
        console.error("Firebase Çekme Hatası:", error);
        if (window.hidePreloader) window.hidePreloader();
    }

    // --- MATRIX PROTOCOL: GİZLİ GİRİŞ ---
let pressTimer;

document.querySelectorAll('.team-card').forEach(card => {
    const startPress = () => {
        const userName = card.getAttribute('data-name');
        // 3 saniye (3000ms) basılı tutarsa
        pressTimer = window.setTimeout(() => {
            sessionStorage.setItem("pendingUser", userName); // İsmi geçici hafızaya al
            window.location.href = "admin.html"; // Admin sayfasına ışınla
        }, 3000);
    };

    const cancelPress = () => {
        clearTimeout(pressTimer); // Eli çekerse sayacı durdur
    };

    // Masaüstü olayları
    card.addEventListener('mousedown', startPress);
    card.addEventListener('mouseup', cancelPress);
    card.addEventListener('mouseleave', cancelPress);

    // Mobil olayları (Sağ tık menüsünü engellemek için contextmenu iptal)
    card.addEventListener('touchstart', (e) => { startPress(); });
    card.addEventListener('touchend', cancelPress);
    card.addEventListener('contextmenu', (e) => e.preventDefault());
});
}

// Hemen çalıştır
loadFirebaseData();
/**
 * Temiz Deniz AR — app.js (Tam Güncel Sürüm)
 */

const PAGES = {
  0: { label: 'Sayfa 0', audio: './audio/sayfa0.mp3' },
  1: { label: 'Sayfa 5', audio: './audio/sayfa5.mp3' },
  2: { label: 'Sayfa 14', audio: './audio/sayfa14.mp3' },
  3: { label: 'Sayfa 15', audio: './audio/sayfa15.mp3' }
};

let currentAudio = null;
let indicatorTimer = null;
let arStarted = false;

// KONTROL AKIŞ DEĞİŞKENLERİ
let isMuted = false;
let modelsVisible = true;

// PINCH TO ZOOM TABAN ÖLÇEKLERİ
const baseScales = { 'target-0': 4, 'target-1': 4, 'target-2': 0.04, 'target-3': 4 };
let scaleModifiers = { 'target-0': 1, 'target-1': 1, 'target-2': 1, 'target-3': 1 };
let startDistance = 0;

function playAudio(src) {
  stopAudio();
  if (!src) return;
  currentAudio = new Audio(src);
  currentAudio.muted = isMuted; 
  currentAudio.play().catch(err => console.warn('Ses oynatılamadı:', err));
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function showIndicator(label) {
  const el = document.getElementById('page-indicator');
  if (!el) return;
  el.textContent = label + ' algılandı';
  el.classList.add('visible');
  clearTimeout(indicatorTimer);
  indicatorTimer = setTimeout(() => el.classList.remove('visible'), 3000);
}

function hideIndicator() {
  const el = document.getElementById('page-indicator');
  if (el) el.classList.remove('visible');
  clearTimeout(indicatorTimer);
}

function bindTargets(scene) {
  Object.entries(PAGES).forEach(([indexStr, page]) => {
    const idx = parseInt(indexStr, 10);
    const entity = document.getElementById('target-' + idx);
    if (!entity) return;

    entity.addEventListener('targetFound', () => {
      console.log('Bulundu:', page.label);
      showIndicator(page.label);
      playAudio(page.audio);
    });

    entity.addEventListener('targetLost', () => {
      console.log('Kayboldu:', page.label);
      hideIndicator();
      stopAudio();
    });
  });
}

function startMindAR() {
  if (arStarted) return;
  arStarted = true;
  const scene = document.getElementById('arScene');

  function tryStart() {
    const mindarSystem = scene.systems['mindar-image-system'];
    if (mindarSystem) {
      bindTargets(scene);
      mindarSystem.start();
      document.getElementById('dashboard').style.display = 'none';
      document.getElementById('ar-ui').classList.add('active');
    } else {
      setTimeout(tryStart, 300);
    }
  }

  if (scene.hasLoaded) {
    tryStart();
  } else {
    scene.addEventListener('loaded', tryStart);
  }
}

// UI VE HAREKET OLAYLARI
document.addEventListener('DOMContentLoaded', () => {
  const temizDenizCard = document.getElementById('temizDenizCard');
  const searchInput = document.getElementById('searchInput');
  const bookCards = document.querySelectorAll('.book-card');
  
  const finishBtn = document.getElementById('finishBtn'); 
  const toggleModelBtn = document.getElementById('toggleModelBtn');
  const toggleAudioBtn = document.getElementById('toggleAudioBtn');

  // 1. Kütüphaneden Kitaba Giriş
  if (temizDenizCard) {
    temizDenizCard.addEventListener('click', () => {
      const titleEl = temizDenizCard.querySelector('.book-title');
      if (titleEl) titleEl.textContent = "Açılıyor...";
      temizDenizCard.style.opacity = "0.7";
      temizDenizCard.style.pointerEvents = "none";
      startMindAR();
    });
  }

  // 2. Canlı Kitap Arama Motoru
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      bookCards.forEach(card => {
        const bookTitle = card.getAttribute('data-title') || "";
        card.style.display = bookTitle.includes(query) ? "flex" : "none";
      });
    });
  }

  // 3. SAĞ PANEL: Model Aç / Kapat Fonksiyonu
  if (toggleModelBtn) {
    toggleModelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      modelsVisible = !modelsVisible;
      document.querySelectorAll('a-gltf-model').forEach(model => {
        model.setAttribute('visible', modelsVisible);
      });
      toggleModelBtn.querySelector('.icon').textContent = modelsVisible ? '👁️' : '🙈';
      toggleModelBtn.querySelector('.text').textContent = modelsVisible ? 'Gizle' : 'Göster';
    });
  }

  // 4. SAĞ PANEL: Ses Aç / Kapat Fonksiyonu
  if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isMuted = !isMuted;
      if (currentAudio) {
        currentAudio.muted = isMuted;
      }
      toggleAudioBtn.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';
      toggleAudioBtn.querySelector('.text').textContent = isMuted ? 'Aç' : 'Kıs';
    });
  }

  // 5. PINCH TO ZOOM
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      startDistance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && startDistance > 0) {
      const currentDistance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const factor = currentDistance / startDistance;
      startDistance = currentDistance;

      Object.keys(scaleModifiers).forEach(id => {
        let newModifier = scaleModifiers[id] * factor;
        if (newModifier >= 0.4 && newModifier <= 2.5) {
          scaleModifiers[id] = newModifier;
          const model = document.querySelector(`#${id} a-gltf-model`);
          if (model) {
            let base = baseScales[id];
            let finalScale = base * newModifier;
            model.setAttribute('scale', `${finalScale} ${finalScale} ${finalScale}`);
          }
        }
      });
    }
  });

  window.addEventListener('touchend', () => {
    startDistance = 0;
  });

  // 6. GÜNCELLEME: Kesin ve Engelsiz Çıkış (Kapat butonu işlevi)
  if (finishBtn) {
    finishBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Tıklamanın A-Frame katmanına takılmasını tamamen engeller
      
      stopAudio();
      hideIndicator();
      document.getElementById('ar-ui').classList.remove('active');
      
      if (temizDenizCard) {
        const titleEl = temizDenizCard.querySelector('.book-title');
        if (titleEl) titleEl.textContent = "Temiz Deniz";
        temizDenizCard.style.opacity = "1";
        temizDenizCard.style.pointerEvents = "auto";
      }
      
      document.getElementById('dashboard').style.display = 'flex';
      
      const scene = document.getElementById('arScene');
      if (scene && scene.systems['mindar-image-system']) {
        scene.systems['mindar-image-system'].stop();
      }
      arStarted = false;
    });
  }
});
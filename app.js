/**
 * Temiz Deniz AR — app.js
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

function playAudio(src) {
  stopAudio();
  if (!src) return;
  currentAudio = new Audio(src);
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
      
      // Modeller yüklendi ve AR sistemi çalıştı! 
      // Şimdi giriş ekranını kapatıp AR kamerasını gösteriyoruz.
      document.getElementById('splash').style.display = 'none';
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

// UI Olayları
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  
  startBtn.addEventListener('click', () => {
    // Kullanıcıya yüklenme durumunu gösteriyoruz
    startBtn.textContent = "Modeller Yükleniyor...";
    startBtn.style.opacity = "0.6";
    startBtn.style.pointerEvents = "none";
    
    startMindAR();
  });

  document.getElementById('closeBtn').addEventListener('click', () => {
    stopAudio();
    hideIndicator();
    document.getElementById('ar-ui').classList.remove('active');
    
    // Reset butonu eski haline getir
    startBtn.textContent = "Hikayeye Başla";
    startBtn.style.opacity = "1";
    startBtn.style.pointerEvents = "auto";
    
    document.getElementById('splash').style.display = 'flex';

    const scene = document.getElementById('arScene');
    const mindarSystem = scene.systems['mindar-image-system'];
    if (mindarSystem) mindarSystem.stop();
    arStarted = false;
  });
});
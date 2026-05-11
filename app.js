const audioFiles = [
  './audio/page_3new.mp3'
];

let currentAudio = null;

function playAudio(index) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio(audioFiles[index]);
  currentAudio.play();
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  scene.addEventListener('loaded', () => {
    const target = document.querySelector('#target-0');
    target.addEventListener('targetFound', () => {
      console.log('Sayfa 0 bulundu');
      playAudio(0);
    });
    target.addEventListener('targetLost', () => {
      console.log('Sayfa 0 kayboldu');
      stopAudio();
    });
  });
});

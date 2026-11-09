/* =========================================================
   Papua Peace Marathon — halaman Segera Hadir
   Trailer diputar otomatis tanpa suara (aturan autoplay browser),
   lalu suara dinyalakan pada interaksi pertama pengunjung
   (klik/ketuk/tombol keyboard) atau lewat tombol "Nyalakan suara".
   ========================================================= */
(function () {
  const frame = document.getElementById('trailer');
  const btn = document.getElementById('trailer-sound');
  if (!frame) return;

  const EVENTS = ['pointerdown', 'keydown', 'touchend']; // gulir tidak dihitung browser sebagai interaksi
  let loaded = false;
  let wantSound = false;

  // Perintah ke pemutar YouTube lewat postMessage (butuh enablejsapi=1 di URL embed)
  const command = (func, args = []) =>
    frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');

  // Pemutar butuh waktu untuk siap, jadi perintah dikirim beberapa kali
  function sendUnmute() {
    [0, 600, 1500].forEach(ms => setTimeout(() => {
      command('unMute');
      command('setVolume', [100]);
      command('playVideo');
    }, ms));
  }

  function unmute() {
    if (wantSound) return;
    wantSound = true;
    btn?.remove();
    EVENTS.forEach(t => document.removeEventListener(t, unmute, true));
    if (loaded) sendUnmute(); // jika belum dimuat (lazy), dikirim saat event load di bawah
  }

  frame.addEventListener('load', () => {
    loaded = true;
    if (wantSound) setTimeout(sendUnmute, 800);
  });

  btn?.addEventListener('click', unmute);
  EVENTS.forEach(t => document.addEventListener(t, unmute, true));
})();

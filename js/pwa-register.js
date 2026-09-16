// تسجيل Service Worker لتمكين PWA والعمل بدون إنترنت
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('PWA Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.warn('PWA Service Worker registration failed:', error);
      });
  });
}

// طلب التخزين الدائم من المتصفح لضمان عدم حذف البيانات إطلاقاً
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log('✅ Persistent storage granted: Data will never be cleared by browser cleanup.');
    } else {
      console.log('ℹ️ Persistent storage not granted automatically, using standard persistent localStorage.');
    }
  }).catch((err) => {
    console.warn('Persistent storage request:', err);
  });
}

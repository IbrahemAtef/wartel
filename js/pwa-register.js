// تسجيل Service Worker لتمكين PWA والعمل بدون إنترنت
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('PWA Service Worker registered successfully:', registration.scope);
        // التحقق التلقائي الفوري من وجود إصدار جديد
        registration.update();
      })
      .catch((error) => {
        console.warn('PWA Service Worker registration failed:', error);
      });
  });

  // عند تفعيل إصدار جديد من Service Worker، إعادة تحميل الصفحة لظهور التعديلات فوراً
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
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

// ============================================================
// المنطق التشغيلي للتطبيق (App Controller)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // تهيئة البيانات الافتراضية إذا كان التشغيل الأول
  initDemoDataIfEmpty();

  // عناصر واجهة المستخدم الرئيسية
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  const offlineBadge = document.getElementById('offline-badge');
  const offlineText = document.getElementById('offline-text');

  // عناصر الشاشة والتبديل
  const homeView = document.getElementById('home-view');
  const historyView = document.getElementById('history-view');
  const goToHistoryBtn = document.getElementById('go-to-history-btn');
  const backToHomeBtn = document.getElementById('back-to-home-btn');

  // عناصر بطاقة سورة اليوم
  const displayTodayDate = document.getElementById('display-today-date');
  const displaySurahName = document.getElementById('display-surah-name');
  const displayPageNumber = document.getElementById('display-page-number');
  const sessionStatusBadge = document.getElementById('session-status-badge');
  const sessionBtnText = document.getElementById('session-btn-text');
  const openSessionModalBtn = document.getElementById('open-session-modal-btn');

  // عناصر الطلاب والبحث
  const studentsListContainer = document.getElementById('students-list-container');
  const searchInput = document.getElementById('search-student-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const statsTotalStudents = document.getElementById('stats-total-students');
  const statsPresentCount = document.getElementById('stats-present-count');
  const statsAbsentCount = document.getElementById('stats-absent-count');

  // أزرار ونوافذ الإجراءات
  const openAddStudentBtn = document.getElementById('open-add-student-btn');
  const openAttendanceTodayBtn = document.getElementById('open-attendance-today-btn');

  // نوافذ Modals
  const sessionModal = document.getElementById('session-modal');
  const studentModal = document.getElementById('student-modal');
  const profileModal = document.getElementById('profile-modal');
  const attendanceModal = document.getElementById('attendance-modal');

  // حقول نافذة المقرر
  const sessionForm = document.getElementById('session-form');
  const sessionDateInput = document.getElementById('session-date-input');
  const sessionSurahSelect = document.getElementById('session-surah-select');
  const sessionPageInput = document.getElementById('session-page-input');

  // حقول نافذة الطالب
  const studentForm = document.getElementById('student-form');
  const studentEditId = document.getElementById('student-edit-id');
  const studentModalHeading = document.getElementById('student-modal-heading');
  const studentNameInput = document.getElementById('student-name-input');
  const studentIdInput = document.getElementById('student-id-input');
  const nationalIdCounter = document.getElementById('national-id-counter');
  const studentPhoneInput = document.getElementById('student-phone-input');
  const studentDobInput = document.getElementById('student-dob-input');
  const studentBirthplaceInput = document.getElementById('student-birthplace-input');

  // حقول نافذة الغياب
  const attendanceModalHeading = document.getElementById('attendance-modal-heading');
  const attendanceDateLabel = document.getElementById('attendance-date-label');
  const attendanceCountLabel = document.getElementById('attendance-count-label');
  const toggleAllAbsenceBtn = document.getElementById('toggle-all-absence-btn');
  const attendancePickerList = document.getElementById('attendance-picker-list');
  const saveAttendanceBtn = document.getElementById('save-attendance-btn');

  // سجل الأيام السابقة
  const historyCardsContainer = document.getElementById('history-cards-container');
  const filterHistoryDate = document.getElementById('filter-history-date');

  // متغيرات حالة تفاعلية
  let currentTargetAttendanceDate = getTodayStr();
  let tempAbsentIds = new Set();
  let currentSelectedStudent = null;

  // -------------------------------------------------------------
  // 1. نظام المظهر (Dark / Light Theme)
  // -------------------------------------------------------------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    saveTheme(theme);
  }

  const initialTheme = getTheme();
  applyTheme(initialTheme);

  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });

  // -------------------------------------------------------------
  // 2. فحص حالة الاتصال والأوفلاين
  // -------------------------------------------------------------
  function updateOnlineStatus() {
    if (navigator.onLine) {
      offlineBadge.className = 'offline-badge';
      offlineText.textContent = 'أوفلاين متاح';
    } else {
      offlineBadge.className = 'offline-badge offline-state';
      offlineText.textContent = 'أوفلاين (محلي)';
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // -------------------------------------------------------------
  // 3. إدارة النوافذ المنبثقة (Modals)
  // -------------------------------------------------------------
  function openModal(modalElement) {
    modalElement.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalElement) {
    modalElement.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      const targetModal = document.getElementById(modalId);
      if (targetModal) closeModal(targetModal);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => closeModal(modal));
    }
  });

  // -------------------------------------------------------------
  // 4. تعبئة قائمة سور القرآن الـ 114
  // -------------------------------------------------------------
  function populateSurahSelect() {
    sessionSurahSelect.innerHTML = '<option value="">-- اختر السورة الكريمة --</option>';
    QURAN_SURAHS.forEach(surah => {
      const option = document.createElement('option');
      option.value = surah.name;
      option.textContent = `${surah.id}. سورة ${surah.name} (تبدأ صـ ${surah.startPage})`;
      option.dataset.id = surah.id;
      option.dataset.startPage = surah.startPage;
      sessionSurahSelect.appendChild(option);
    });
  }
  populateSurahSelect();

  // اقتراح رقم الصفحة تلقائياً عند اختيار السورة
  sessionSurahSelect.addEventListener('change', () => {
    const selectedOption = sessionSurahSelect.options[sessionSurahSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.startPage) {
      if (!sessionPageInput.value || Number(sessionPageInput.value) <= 1) {
        sessionPageInput.value = selectedOption.dataset.startPage;
      }
    }
  });

  // -------------------------------------------------------------
  // 5. عرض وتحديث مقرر اليوم (Daily Quran Session)
  // -------------------------------------------------------------
  function renderTodaySession() {
    const today = getTodayStr();
    const formattedDate = formatDateArabic(today);
    displayTodayDate.textContent = formattedDate;

    const session = getDailySession(today);
    if (session && session.surahName) {
      displaySurahName.textContent = `سورة ${session.surahName}`;
      displayPageNumber.textContent = session.pageNumber;
      sessionStatusBadge.textContent = 'مقرر مسجل ✓';
      sessionStatusBadge.style.background = 'var(--primary-gradient)';
      sessionBtnText.textContent = 'تعديل اسم السورة ورقم الصفحة';
    } else {
      displaySurahName.textContent = 'لم يُسجل مقرر اليوم';
      displayPageNumber.textContent = '-';
      sessionStatusBadge.textContent = 'بانتظار التسجيل';
      sessionStatusBadge.style.background = 'var(--gold-gradient)';
      sessionBtnText.textContent = 'إضافة سورة وصفحة اليوم';
    }
  }

  openSessionModalBtn.addEventListener('click', () => {
    const today = getTodayStr();
    sessionDateInput.value = today;
    const session = getDailySession(today);

    if (session) {
      document.getElementById('session-modal-heading').textContent = 'تعديل سورة وصفحة اليوم';
      sessionSurahSelect.value = session.surahName;
      sessionPageInput.value = session.pageNumber;
    } else {
      document.getElementById('session-modal-heading').textContent = 'إضافة سورة وصفحة اليوم';
      sessionSurahSelect.value = '';
      sessionPageInput.value = '';
    }
    openModal(sessionModal);
  });

  sessionDateInput.addEventListener('change', () => {
    const targetDate = sessionDateInput.value;
    const session = getDailySession(targetDate);
    if (session) {
      sessionSurahSelect.value = session.surahName;
      sessionPageInput.value = session.pageNumber;
    } else {
      sessionSurahSelect.value = '';
      sessionPageInput.value = '';
    }
  });

  sessionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dateStr = sessionDateInput.value;
    const surahName = sessionSurahSelect.value;
    const pageNumber = Number(sessionPageInput.value);

    if (!surahName) {
      showToast('يرجى اختيار اسم السورة الكريمة', 'error');
      return;
    }

    if (!pageNumber || pageNumber < 1 || pageNumber > 604) {
      showToast('رقم الصفحة يجب أن يكون بين 1 و 604', 'error');
      return;
    }

    const selectedOption = sessionSurahSelect.options[sessionSurahSelect.selectedIndex];
    const surahNumber = selectedOption ? selectedOption.dataset.id : 1;

    saveDailySession(dateStr, {
      surahName,
      surahNumber,
      pageNumber
    });

    closeModal(sessionModal);
    renderTodaySession();
    renderHistoryCards();
    showToast('تم حفظ المقرر اليومي بنجاح 📖', 'success');
  });

  // -------------------------------------------------------------
  // 6. عرض قائمة الطلاب وشريط البحث
  // -------------------------------------------------------------
  function renderStudentsList() {
    const students = getStudents();
    const query = (searchInput.value || '').trim().toLowerCase();
    const today = getTodayStr();
    const todayAttendance = getAttendance(today);
    const absentIds = new Set(todayAttendance ? todayAttendance.absentStudentIds : []);

    const filtered = students.filter(s => s.fullName.toLowerCase().includes(query));

    // تحديث شريط الإحصائيات
    statsTotalStudents.textContent = `إجمالي الطلاب: ${students.length}`;
    if (todayAttendance) {
      const absentCount = absentIds.size;
      const presentCount = Math.max(0, students.length - absentCount);
      statsPresentCount.textContent = `حاضر: ${presentCount}`;
      statsAbsentCount.textContent = `غياب: ${absentCount}`;
    } else {
      statsPresentCount.textContent = `حاضر: -`;
      statsAbsentCount.textContent = `الغياب لم يسجل بعد`;
    }

    studentsListContainer.innerHTML = '';

    if (filtered.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-list-placeholder';
      emptyState.innerHTML = `
        <div class="empty-icon">👥</div>
        <div class="empty-title">${query ? 'لا يوجد طلاب يطابقون اسم البحث' : 'لا يوجد طلاب مسجلين حتى الآن'}</div>
        <div style="font-size: 0.85rem;">اضغط على "إضافة طالب جديد" للبدء في التسجيل</div>
      `;
      studentsListContainer.appendChild(emptyState);
      return;
    }

    filtered.forEach(student => {
      const isAbsent = absentIds.has(student.id);
      const isAttendanceRecorded = !!todayAttendance;

      const card = document.createElement('div');
      card.className = `student-card ${isAttendanceRecorded ? (isAbsent ? 'is-absent' : 'is-present') : ''}`;

      // الحرف الأول كأيقونة
      const firstChar = student.fullName.trim().charAt(0) || 'ط';

      let statusBadgeHtml = '';
      if (isAttendanceRecorded) {
        statusBadgeHtml = isAbsent
          ? `<span class="status-badge absent">غائب اليوم</span>`
          : `<span class="status-badge present">حاضر اليوم</span>`;
      }

      // حساب السورة التالية في الدور من جزء عم (تبدأ من الناس صعوداً)
      const nextSurah = getNextSurahForStudent(student.id);
      const nextSurahText = nextSurah ? `سورة ${nextSurah.name}` : 'أتمت جزء عم كاملاً 🌟';

      card.innerHTML = `
        <div class="student-card-top-row">
          <div class="student-info-col">
            <div class="student-avatar">${firstChar}</div>
            <div class="student-texts">
              <div class="student-name">${student.fullName}</div>
              <div class="student-subinfo">
                <span>هوية: ${student.nationalId}</span>
                ${statusBadgeHtml}
              </div>
            </div>
          </div>
        </div>

        <div class="student-next-surah-box">
          <span style="color: var(--text-tertiary); font-weight: 600;">📖 السورة التالية في الدور:</span>
          <span class="next-surah-tag">🎯 ${nextSurahText}</span>
        </div>

        <div class="student-card-actions-row">
          <button type="button" class="btn-card-recite" title="تسجيل تسميع سورة من جزء عم">
            <span>📖</span>
            <span>تسجيل التسميع</span>
          </button>
          <button type="button" class="btn-card-delete" title="حذف الطالبة">
            <span>🗑️</span>
            <span>حذف</span>
          </button>
        </div>
      `;

      // فتح ملف الطالب عند النقر على البطاقة
      card.addEventListener('click', () => {
        openStudentProfile(student);
      });

      // زر تسجيل التسميع من البطاقة مباشرة
      card.querySelector('.btn-card-recite').addEventListener('click', (e) => {
        e.stopPropagation();
        openRecitationModal(student);
      });

      // زر الحذف من البطاقة مباشرة
      card.querySelector('.btn-card-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        currentSelectedStudent = student;
        deleteStudentName.textContent = `"${student.fullName}"`;
        openModal(deleteConfirmModal);
      });

      studentsListContainer.appendChild(card);
    });
  }

  // البحث الفوري
  searchInput.addEventListener('input', () => {
    clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
    renderStudentsList();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderStudentsList();
    searchInput.focus();
  });

  // -------------------------------------------------------------
  // 7. إضافة / تعديل بيانات الطالب (Form & Validation)
  // -------------------------------------------------------------
  studentIdInput.addEventListener('input', () => {
    // إبقاء الأرقام فقط
    studentIdInput.value = studentIdInput.value.replace(/\D/g, '');
    const len = studentIdInput.value.length;
    nationalIdCounter.textContent = `${len} / 9 أرقام`;
    if (len === 9) {
      nationalIdCounter.style.color = 'var(--success)';
    } else {
      nationalIdCounter.style.color = 'var(--text-tertiary)';
    }
  });

  openAddStudentBtn.addEventListener('click', () => {
    studentEditId.value = '';
    studentModalHeading.textContent = 'إضافة طالب جديد';
    studentNameInput.value = '';
    studentIdInput.value = '';
    nationalIdCounter.textContent = '9 أرقام بالضبط';
    nationalIdCounter.style.color = 'var(--text-tertiary)';
    studentPhoneInput.value = '';
    studentDobInput.value = '';
    studentBirthplaceInput.value = '';

    hideAllFormErrors();
    openModal(studentModal);
  });

  function hideAllFormErrors() {
    document.querySelectorAll('.form-error-msg').forEach(el => el.classList.remove('visible'));
  }

  studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAllFormErrors();

    const fullName = studentNameInput.value.trim();
    const nationalId = studentIdInput.value.trim();
    const phone = studentPhoneInput.value.trim();
    const birthDate = studentDobInput.value;
    const birthPlace = studentBirthplaceInput.value.trim();
    const editId = studentEditId.value || null;

    let hasError = false;

    if (!fullName || fullName.length < 3) {
      document.getElementById('student-name-error').classList.add('visible');
      hasError = true;
    }

    const idCheck = validateNationalId(nationalId, editId);
    if (!idCheck.valid) {
      const idErrorEl = document.getElementById('student-id-error');
      idErrorEl.textContent = idCheck.message;
      idErrorEl.classList.add('visible');
      hasError = true;
    }

    if (!phone || phone.length < 9) {
      document.getElementById('student-phone-error').classList.add('visible');
      hasError = true;
    }

    if (hasError) return;

    try {
      saveStudent({
        id: editId,
        fullName,
        nationalId: idCheck.cleanId,
        phone,
        birthDate,
        birthPlace
      });

      closeModal(studentModal);
      renderStudentsList();
      showToast(editId ? 'تم تعديل بيانات الطالب بنجاح' : 'تمت إضافة الطالب الجديد بنجاح 🎉', 'success');
    } catch (err) {
      showToast(err.message || 'حدث خطأ أثناء حفظ الطالب', 'error');
    }
  });

  // -------------------------------------------------------------
  // 8. عرض ملف الطالب الكامل وتاريخ غيابه ومتابعة جزء عم
  // -------------------------------------------------------------
  function renderProfileJuzAmma(student) {
    const completedSurahs = new Set(getStudentRecitations(student.id));
    const nextSurah = getNextSurahForStudent(student.id);
    const totalCount = JUZ_AMMA_SURAHS.length;
    const completedCount = completedSurahs.size;

    document.getElementById('profile-juz-progress').textContent = `${completedCount} / ${totalCount}`;
    const percent = Math.round((completedCount / totalCount) * 100);
    document.getElementById('profile-juz-progress-bar').style.width = `${percent}%`;

    const grid = document.getElementById('profile-juz-surahs-grid');
    grid.innerHTML = '';

    JUZ_AMMA_SURAHS.forEach(surah => {
      const isCompleted = completedSurahs.has(surah.id);
      const isNext = nextSurah && nextSurah.id === surah.id;

      const chip = document.createElement('div');
      chip.className = `juz-surah-chip ${isCompleted ? 'completed' : ''} ${isNext ? 'next-in-turn' : ''}`;

      let iconHtml = `<span style="font-size: 0.68rem; opacity: 0.7;">#${surah.order}</span>`;
      if (isCompleted) iconHtml = `<span>✓</span>`;
      else if (isNext) iconHtml = `<span>🎯</span>`;

      chip.innerHTML = `
        ${iconHtml}
        <span>${surah.name}</span>
      `;

      chip.title = isCompleted ? `تم التسميع - اضغط للإلغاء` : (isNext ? `السورة التالية - اضغط للتسميع` : `اضغط لتسجيل التسميع`);

      chip.addEventListener('click', () => {
        toggleStudentRecitation(student.id, surah.id);
        renderProfileJuzAmma(student);
        renderStudentsList();
        const nowCompleted = !isCompleted;
        showToast(nowCompleted ? `تم تسجيل تسميع سورة ${surah.name} بنجاح ✓` : `تم إلغاء تسميع سورة ${surah.name}`, 'success');
      });

      grid.appendChild(chip);
    });
  }

  function openStudentProfile(student) {
    currentSelectedStudent = student;
    document.getElementById('profile-student-name').textContent = student.fullName;
    document.getElementById('profile-national-id').textContent = student.nationalId;
    document.getElementById('profile-phone').textContent = student.phone || 'غير مسجل';
    document.getElementById('profile-dob').textContent = student.birthDate || 'غير مسجل';
    document.getElementById('profile-birthplace').textContent = student.birthPlace || 'غير مسجل';

    // عرض ومتابعة سور جزء عم (قبل سجل الغياب)
    renderProfileJuzAmma(student);

    // تحميل وسوم تاريخ غيابات الطالب
    const absenceHistory = getStudentAbsenceHistory(student.id);
    const container = document.getElementById('profile-absence-tags-container');
    const title = document.getElementById('profile-absence-title');
    container.innerHTML = '';

    title.textContent = `سجل الغياب (${absenceHistory.length} أيام):`;

    if (absenceHistory.length === 0) {
      container.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--success); font-weight: 700; padding: 6px 0;">
          🌟 لا يوجد أي غياب مسجل للطالب سابقاً (حضور مستمر ومثالي).
        </div>
      `;
    } else {
      absenceHistory.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'student-chip-tag absent-tag';
        const sessionInfo = item.session ? ` (${item.session.surahName} صـ ${item.session.pageNumber})` : '';
        tag.innerHTML = `❌ ${item.formattedDate}${sessionInfo}`;
        container.appendChild(tag);
      });
    }

    openModal(profileModal);
  }

  // -------------------------------------------------------------
  // نافذة تسجيل تسميع سورة من جزء عم (Recitation Modal)
  // -------------------------------------------------------------
  let currentRecitationStudent = null;
  const recitationModal = document.getElementById('recitation-modal');
  const recitationStudentName = document.getElementById('recitation-student-name');
  const recitationSuggestedName = document.getElementById('recitation-suggested-name');
  const recitationSurahSelect = document.getElementById('recitation-surah-select');
  const confirmRecitationBtn = document.getElementById('confirm-recitation-btn');

  function openRecitationModal(student) {
    currentRecitationStudent = student;
    recitationStudentName.textContent = student.fullName;

    const completedIds = new Set(getStudentRecitations(student.id));
    const nextSurah = getNextSurahForStudent(student.id);

    recitationSurahSelect.innerHTML = '';
    JUZ_AMMA_SURAHS.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      const isDone = completedIds.has(s.id) ? ' (تم تسميعها مسبقاً ✓)' : '';
      opt.textContent = `${s.order}. سورة ${s.name}${isDone}`;
      recitationSurahSelect.appendChild(opt);
    });

    if (nextSurah) {
      recitationSuggestedName.textContent = `سورة ${nextSurah.name}`;
      recitationSurahSelect.value = nextSurah.id;
    } else {
      recitationSuggestedName.textContent = 'أتمت جميع سور جزء عم كاملاً 🌟';
      recitationSurahSelect.value = JUZ_AMMA_SURAHS[0].id;
    }

    openModal(recitationModal);
  }

  confirmRecitationBtn.addEventListener('click', () => {
    if (!currentRecitationStudent) return;
    const surahId = Number(recitationSurahSelect.value);
    saveStudentRecitation(currentRecitationStudent.id, surahId);
    const surahObj = JUZ_AMMA_SURAHS.find(s => s.id === surahId);
    const surahName = surahObj ? surahObj.name : '';

    closeModal(recitationModal);
    renderStudentsList();

    if (profileModal.classList.contains('active') && currentSelectedStudent && currentSelectedStudent.id === currentRecitationStudent.id) {
      renderProfileJuzAmma(currentSelectedStudent);
    }

    showToast(`تم تسجيل تسميع سورة ${surahName} للطالبة بنجاح 📖`, 'success');
  });

  // تعديل الطالب من الملف الشخصي
  document.getElementById('profile-edit-btn').addEventListener('click', () => {
    if (!currentSelectedStudent) return;
    closeModal(profileModal);

    studentEditId.value = currentSelectedStudent.id;
    studentModalHeading.textContent = 'تعديل بيانات الطالب';
    studentNameInput.value = currentSelectedStudent.fullName;
    studentIdInput.value = currentSelectedStudent.nationalId;
    nationalIdCounter.textContent = `${currentSelectedStudent.nationalId.length} / 9 أرقام`;
    nationalIdCounter.style.color = 'var(--success)';
    studentPhoneInput.value = currentSelectedStudent.phone;
    studentDobInput.value = currentSelectedStudent.birthDate || '';
    studentBirthplaceInput.value = currentSelectedStudent.birthPlace || '';

    hideAllFormErrors();
    openModal(studentModal);
  });

  // عناصر نافذة تأكيد الحذف المنبثقة
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');
  const deleteStudentName = document.getElementById('delete-student-name');
  const confirmDeleteActionBtn = document.getElementById('confirm-delete-action-btn');

  // فتح نافذة تأكيد حذف الطالب بدلاً من confirm() الافتراضي
  document.getElementById('profile-delete-btn').addEventListener('click', () => {
    if (!currentSelectedStudent) return;
    deleteStudentName.textContent = `"${currentSelectedStudent.fullName}"`;
    openModal(deleteConfirmModal);
  });

  // تنفيذ الحذف النهائي عند تأكيد المستخدم
  confirmDeleteActionBtn.addEventListener('click', () => {
    if (!currentSelectedStudent) return;
    const studentName = currentSelectedStudent.fullName;
    deleteStudent(currentSelectedStudent.id);
    closeModal(deleteConfirmModal);
    closeModal(profileModal);
    currentSelectedStudent = null;
    renderStudentsList();
    renderHistoryCards();
    showToast(`تم حذف الطالب "${studentName}" وجميع سجلاته بنجاح 🗑️`, 'success');
  });

  // -------------------------------------------------------------
  // 9. نافذة تسجيل غياب اليوم / تعديل غياب يوم سابق
  // -------------------------------------------------------------
  function openAttendanceModalForDate(dateStr) {
    currentTargetAttendanceDate = dateStr;
    const isToday = dateStr === getTodayStr();

    attendanceModalHeading.textContent = isToday ? 'تسجيل غياب اليوم' : 'تعديل غياب يوم سابق';
    attendanceDateLabel.textContent = `التاريخ: ${formatDateArabic(dateStr)}`;

    const currentAttendance = getAttendance(dateStr);
    tempAbsentIds = new Set(currentAttendance ? currentAttendance.absentStudentIds : []);

    renderAttendancePickerItems();
    openModal(attendanceModal);
  }

  openAttendanceTodayBtn.addEventListener('click', () => {
    openAttendanceModalForDate(getTodayStr());
  });

  function renderAttendancePickerItems() {
    const students = getStudents();
    attendancePickerList.innerHTML = '';

    if (students.length === 0) {
      attendancePickerList.innerHTML = `<div class="empty-list-placeholder">لا يوجد طلاب مسجلين لتحديد الغياب</div>`;
      attendanceCountLabel.textContent = `الغياب: 0`;
      return;
    }

    attendanceCountLabel.textContent = `الغياب: ${tempAbsentIds.size} من ${students.length}`;

    students.forEach(student => {
      const isAbsent = tempAbsentIds.has(student.id);

      const item = document.createElement('div');
      item.className = `attendance-picker-item ${isAbsent ? 'selected-absent' : ''}`;

      item.innerHTML = `
        <div class="picker-student-details">
          <div class="student-avatar" style="width: 36px; height: 36px; font-size: 0.95rem;">
            ${student.fullName.charAt(0)}
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem;">${student.fullName}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">هوية: ${student.nationalId}</div>
          </div>
        </div>

        <div class="picker-checkbox">
          ${isAbsent ? '✕' : ''}
        </div>
      `;

      item.addEventListener('click', () => {
        if (tempAbsentIds.has(student.id)) {
          tempAbsentIds.delete(student.id);
        } else {
          tempAbsentIds.add(student.id);
        }
        renderAttendancePickerItems();
      });

      attendancePickerList.appendChild(item);
    });
  }

  // تحديد الكل / إلغاء تحديد الكل
  toggleAllAbsenceBtn.addEventListener('click', () => {
    const students = getStudents();
    if (tempAbsentIds.size === students.length) {
      tempAbsentIds.clear();
      toggleAllAbsenceBtn.textContent = 'تحديد الكل غياب';
    } else {
      tempAbsentIds = new Set(students.map(s => s.id));
      toggleAllAbsenceBtn.textContent = 'إلغاء تحديد الكل';
    }
    renderAttendancePickerItems();
  });

  // حفظ الغياب
  saveAttendanceBtn.addEventListener('click', () => {
    saveAttendance(currentTargetAttendanceDate, Array.from(tempAbsentIds));
    closeModal(attendanceModal);
    renderStudentsList();
    renderHistoryCards();
    showToast(`تم حفظ غياب يوم ${formatDateArabic(currentTargetAttendanceDate)} بنجاح 📋`, 'success');
  });

  // -------------------------------------------------------------
  // 10. شاشة سجل الغياب للأيام السابقة
  // -------------------------------------------------------------
  goToHistoryBtn.addEventListener('click', () => {
    homeView.style.display = 'none';
    historyView.classList.add('active');
    renderHistoryCards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  backToHomeBtn.addEventListener('click', () => {
    historyView.classList.remove('active');
    homeView.style.display = 'flex';
    renderStudentsList();
    renderTodaySession();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function renderHistoryCards() {
    const dates = getAllAttendanceDates();
    const students = getStudents();
    const studentMap = new Map(students.map(s => [s.id, s]));
    const filterDate = filterHistoryDate.value;

    historyCardsContainer.innerHTML = '';

    const displayedDates = filterDate ? dates.filter(d => d === filterDate) : dates;

    if (displayedDates.length === 0) {
      historyCardsContainer.innerHTML = `
        <div class="empty-list-placeholder">
          <div class="empty-icon">🗂️</div>
          <div class="empty-title">لا توجد سجلات غياب مسجلة ${filterDate ? 'لهذا التاريخ' : 'حتى الآن'}</div>
          <div style="font-size: 0.85rem;">عند تسجيل غياب الأيام ستظهر تلقائياً هنا بالتفصيل</div>
        </div>
      `;
      return;
    }

    displayedDates.forEach(dateStr => {
      const attendance = getAttendance(dateStr);
      const session = getDailySession(dateStr);
      const absentIds = attendance ? attendance.absentStudentIds : [];
      const hasAbsent = absentIds.length > 0;

      const card = document.createElement('div');
      card.className = 'history-card';

      let sessionText = 'لم يُسجل مقرر لهذا اليوم';
      if (session && session.surahName) {
        sessionText = `سورة ${session.surahName} - صفحة ${session.pageNumber}`;
      }

      // تجهيز وسوم أسماء الغائبين
      let absentNamesHtml = '';
      if (hasAbsent) {
        absentNamesHtml = absentIds.map(id => {
          const student = studentMap.get(id);
          const name = student ? student.fullName : 'طالب محذوف';
          return `<span class="student-chip-tag absent-tag">👤 ${name}</span>`;
        }).join('');
      } else {
        absentNamesHtml = `<span style="font-size: 0.85rem; color: var(--success); font-weight: 700;">🌟 حضور كامل لجميع طلاب الحلقة بدون غياب!</span>`;
      }

      card.innerHTML = `
        <div class="history-card-header">
          <div>
            <div class="history-card-date">${formatDateArabic(dateStr)}</div>
            <div class="history-session-info">
              <span>📖</span>
              <span>${sessionText}</span>
            </div>
          </div>
          <span class="history-absent-badge ${hasAbsent ? 'has-absent' : 'no-absent'}">
            ${hasAbsent ? `الغياب: ${absentIds.length}` : 'حضور كامل'}
          </span>
        </div>

        <div class="history-absent-names-list">
          ${absentNamesHtml}
        </div>

        <div class="history-card-footer">
          <button type="button" class="btn btn-secondary edit-history-btn" style="padding: 6px 14px; min-height: 38px; font-size: 0.85rem;">
            <span>✏️</span>
            <span>تعديل غياب هذا اليوم</span>
          </button>
        </div>
      `;

      card.querySelector('.edit-history-btn').addEventListener('click', () => {
        openAttendanceModalForDate(dateStr);
      });

      historyCardsContainer.appendChild(card);
    });
  }

  filterHistoryDate.addEventListener('change', () => {
    renderHistoryCards();
  });

  // -------------------------------------------------------------
  // 11. إشعارات Toast التفاعلية
  // -------------------------------------------------------------
  function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : '⚠️'}</span>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // التشغيل الأولي للواجهات
  renderTodaySession();
  renderStudentsList();
});

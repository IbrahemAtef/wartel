// إدارة التخزين المحلي والعمليات على البيانات (Students, Daily Sessions, Attendance)

const STORAGE_KEYS = {
  LAST_BACKUP: 'wartel_last_backup_date',
  POSTPONE_BACKUP: 'wartel_postpone_backup_date',
  FIRST_RUN: 'wartel_first_run_date',
  INITIALIZED: 'wartel_initialized_v2',
  STUDENTS: 'maram_students_v1',
  SESSIONS: 'maram_sessions_v1',
  ATTENDANCE: 'maram_attendance_v1',
  THEME: 'maram_theme_v1',
  RECITATIONS: 'maram_recitations_v1',
  EXAMS: 'wartel_exams_v1',
  EXAM_CARD_MODEL: 'wartel_exam_card_model_v1'
};

// دوال مساعدة للتاريخ
function getTodayStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// -------------------------------------------------------------
// دوال مساعدة لتنسيق التواريخ بصيغة DD/MM/YYYY
// -------------------------------------------------------------


// تحويل أي تاريخ سواء كان DD/MM/YYYY أو YYYY-MM-DD إلى الصيغة المعيارية YYYY-MM-DD
function normalizeToIsoDate(str) {
  if (!str) return '';
  str = str.trim();
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  return str;
}

function getTodayDMY() {
  return formatDateDMY(getTodayStr());
}

function formatDateDMY(dateStr) {
  if (!dateStr) return '-';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }
  return dateStr;
}

function formatDateWithDay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  const dayName = date.toLocaleDateString('ar-SA', { weekday: 'long' });
  const dmy = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  return `${dayName} ${dmy}`;
}

function formatDateArabic(dateStr) {
  return formatDateWithDay(dateStr);
}

// استرجاع وحفظ البيانات العامة بأمان
function safeGet(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    return data !== null ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultValue;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
    return false;
  }
}

// -------------------------------------------------------------
// إدارة الطلاب (Students)
// -------------------------------------------------------------

function getStudents() {
  return safeGet(STORAGE_KEYS.STUDENTS, []);
}

function getStudentById(id) {
  const students = getStudents();
  return students.find(s => s.id === id) || null;
}

function validateNationalId(nationalId, excludeStudentId = null) {
  const cleanId = String(nationalId || '').trim();
  if (!/^\d{9}$/.test(cleanId)) {
    return { valid: false, message: 'رقم الهوية يجب أن يتكون من 9 أرقام بالضبط.' };
  }
  const students = getStudents();
  const duplicate = students.find(s => s.nationalId === cleanId && s.id !== excludeStudentId);
  if (duplicate) {
    return { valid: false, message: `رقم الهوية مسجل مسبقاً للطالب: ${duplicate.fullName}` };
  }
  return { valid: true, cleanId };
}

function saveStudent(studentData) {
  const students = getStudents();
  const validation = validateNationalId(studentData.nationalId, studentData.id);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  if (studentData.id) {
    // تعديل
    const index = students.findIndex(s => s.id === studentData.id);
    if (index === -1) throw new Error('الطالب غير موجود.');
    students[index] = {
      ...students[index],
      ...studentData,
      nationalId: validation.cleanId,
      updatedAt: new Date().toISOString()
    };
    safeSet(STORAGE_KEYS.STUDENTS, students);
    return students[index];
  } else {
    // إضافة جديد
    const newStudent = {
      id: 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      fullName: studentData.fullName.trim(),
      nationalId: validation.cleanId,
      phone: (studentData.phone || '').trim(),
      birthDate: normalizeToIsoDate(studentData.birthDate) || '',
      birthPlace: (studentData.birthPlace || '').trim(),
      createdAt: new Date().toISOString()
    };
    students.push(newStudent);
    // ترتيب أبجدي تلقائي
    students.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar'));
    safeSet(STORAGE_KEYS.STUDENTS, students);
    return newStudent;
  }
}

function deleteStudent(studentId) {
  let students = getStudents();
  students = students.filter(s => s.id !== studentId);
  safeSet(STORAGE_KEYS.STUDENTS, students);

  // حذف الطالب من سجلات الغياب القديمة أيضاً للحفاظ على اتساق البيانات
  const attendance = getAllAttendance();
  let attendanceModified = false;
  Object.keys(attendance).forEach(date => {
    if (attendance[date].absentStudentIds.includes(studentId)) {
      attendance[date].absentStudentIds = attendance[date].absentStudentIds.filter(id => id !== studentId);
      attendanceModified = true;
    }
  });
  if (attendanceModified) {
    safeSet(STORAGE_KEYS.ATTENDANCE, attendance);
  }

  // حذف سجلات التسميع للطالب
  const recitations = getAllRecitations();
  if (recitations[studentId]) {
    delete recitations[studentId];
    safeSet(STORAGE_KEYS.RECITATIONS, recitations);
  }

  // حذف سجلات الاختبارات للطالب
  const exams = getAllExams();
  if (exams[studentId]) {
    delete exams[studentId];
    safeSet(STORAGE_KEYS.EXAMS, exams);
  }

  return true;
}

// -------------------------------------------------------------
// إدارة ومتابعة تسميع سور جزء عم (Juz' Amma Recitation Tracker)
// -------------------------------------------------------------

function getAllRecitations() {
  return safeGet(STORAGE_KEYS.RECITATIONS, {});
}

function getStudentRecitations(studentId) {
  const all = getAllRecitations();
  return all[studentId] ? all[studentId].completedSurahIds || [] : [];
}

// معرفة السورة التالية في الدور (تبدأ من الناس 114 ثم الفلق 113 صعوداً للنبأ 78)
function getNextSurahForStudent(studentId) {
  const completedIds = new Set(getStudentRecitations(studentId));
  for (const surah of JUZ_AMMA_SURAHS) {
    if (!completedIds.has(surah.id)) {
      return surah;
    }
  }
  return null; // أتم جميع سور جزء عم
}

function saveStudentRecitation(studentId, surahId) {
  const all = getAllRecitations();
  if (!all[studentId]) {
    all[studentId] = { completedSurahIds: [], history: [] };
  }
  const sId = Number(surahId);
  const surah = JUZ_AMMA_SURAHS.find(s => s.id === sId);
  const surahName = surah ? surah.name : '';

  if (!all[studentId].completedSurahIds.includes(sId)) {
    all[studentId].completedSurahIds.push(sId);
    all[studentId].history.push({
      surahId: sId,
      surahName,
      date: getTodayStr(),
      timestamp: new Date().toISOString()
    });
  }
  safeSet(STORAGE_KEYS.RECITATIONS, all);
  return all[studentId];
}

function toggleStudentRecitation(studentId, surahId) {
  const all = getAllRecitations();
  if (!all[studentId]) {
    all[studentId] = { completedSurahIds: [], history: [] };
  }
  const sId = Number(surahId);
  const index = all[studentId].completedSurahIds.indexOf(sId);
  if (index > -1) {
    all[studentId].completedSurahIds.splice(index, 1);
    all[studentId].history = (all[studentId].history || []).filter(h => h.surahId !== sId);
  } else {
    const surah = JUZ_AMMA_SURAHS.find(s => s.id === sId);
    all[studentId].completedSurahIds.push(sId);
    all[studentId].history = all[studentId].history || [];
    all[studentId].history.push({
      surahId: sId,
      surahName: surah ? surah.name : '',
      date: getTodayStr(),
      timestamp: new Date().toISOString()
    });
  }
  safeSet(STORAGE_KEYS.RECITATIONS, all);
  return all[studentId];
}

// -------------------------------------------------------------
// إدارة المقررات اليومية (Daily Quran Sessions)
// -------------------------------------------------------------

function getAllSessions() {
  return safeGet(STORAGE_KEYS.SESSIONS, {});
}

function getDailySession(dateStr = getTodayStr()) {
  const sessions = getAllSessions();
  return sessions[dateStr] || null;
}

function saveDailySession(dateStr, sessionData) {
  const cleanDate = normalizeToIsoDate(dateStr) || getTodayStr();
  const sessions = getAllSessions();
  sessions[cleanDate] = {
    surahName: (sessionData.surahName || '').trim(),
    surahNumber: Number(sessionData.surahNumber) || 1,
    pageNumber: Number(sessionData.pageNumber) || 1,
    updatedAt: new Date().toISOString()
  };
  safeSet(STORAGE_KEYS.SESSIONS, sessions);
  return sessions[cleanDate];
}

// -------------------------------------------------------------
// إدارة الغياب (Attendance Records)
// -------------------------------------------------------------

function getAllAttendance() {
  return safeGet(STORAGE_KEYS.ATTENDANCE, {});
}

function getAttendance(dateStr = getTodayStr()) {
  const all = getAllAttendance();
  return all[dateStr] || null;
}

function saveAttendance(dateStr, absentStudentIds = []) {
  const cleanDate = normalizeToIsoDate(dateStr) || getTodayStr();
  const all = getAllAttendance();
  all[cleanDate] = {
    absentStudentIds: Array.from(new Set(absentStudentIds)),
    updatedAt: new Date().toISOString()
  };
  safeSet(STORAGE_KEYS.ATTENDANCE, all);
  return all[cleanDate];
}

function getAllAttendanceDates() {
  const all = getAllAttendance();
  return Object.keys(all).sort((a, b) => b.localeCompare(a)); // من الأحدث للأقدم
}

function getStudentAbsenceHistory(studentId) {
  const all = getAllAttendance();
  const sessions = getAllSessions();
  const history = [];

  Object.keys(all)
    .sort((a, b) => b.localeCompare(a))
    .forEach(date => {
      if (all[date].absentStudentIds.includes(studentId)) {
        history.push({
          date,
          formattedDate: formatDateArabic(date),
          session: sessions[date] || null
        });
      }
    });

  return history;
}

// -------------------------------------------------------------
// المظهر (Theme)
// -------------------------------------------------------------

function getTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME);
  if (saved) return saved;
  // تفضيل نظام التشغيل
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// -------------------------------------------------------------
// تهيئة بيانات افتراضية إذا كان التطبيق يفتح لأول مرة
// -------------------------------------------------------------

function initDemoDataIfEmpty() {
  // 1. إذا تم تهيئة التطبيق مسبقاً، نمنع نهائياً مسح أو استبدال بيانات المستخدم
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    return;
  }

  // 2. إذا كانت توجد أي بيانات سابقة (حتى لو كانت قائمة فارغة أو جلسات مسجلة)، نعتبر التطبيق مهيأً ولا نلمسها
  const existingStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  const existingSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  const existingAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  if (existingStudents !== null || existingSessions !== null || existingAttendance !== null) {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    return;
  }

  // 3. فقط في أول زيارة مطلقة للتطبيق على جهاز جديد تماماً:
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  const today = getTodayStr();
  const demoStudents = [
    {
      id: 'std_demo_1',
      fullName: 'عبدالرحمن إبراهيم المطيري',
      nationalId: '109283746',
      phone: '0551234567',
      birthDate: '2012-04-12',
      birthPlace: 'الرياض',
      createdAt: new Date().toISOString()
    },
    {
      id: 'std_demo_2',
      fullName: 'عمر خالد الدوسري',
      nationalId: '108374659',
      phone: '0547654321',
      birthDate: '2011-09-20',
      birthPlace: 'الدمام',
      createdAt: new Date().toISOString()
    },
    {
      id: 'std_demo_3',
      fullName: 'يوسف محمد القحطاني',
      nationalId: '107465982',
      phone: '0509876543',
      birthDate: '2013-01-15',
      birthPlace: 'جدة',
      createdAt: new Date().toISOString()
    },
    {
      id: 'std_demo_4',
      fullName: 'حمزة عبدالله الغامدي',
      nationalId: '106598473',
      phone: '0562345678',
      birthDate: '2012-11-03',
      birthPlace: 'مكة المكرمة',
      createdAt: new Date().toISOString()
    }
  ];
  safeSet(STORAGE_KEYS.STUDENTS, demoStudents);

    // تسجيل مقرر افتراضي لليوم
    saveDailySession(today, {
      surahName: 'البقرة',
      surahNumber: 2,
      pageNumber: 15
    });

    // تسجيل غياب تجريبي ليوم أمس لكي يظهر في سجل الأيام السابقة فوراً
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    saveDailySession(yesterdayStr, {
      surahName: 'البقرة',
      surahNumber: 2,
      pageNumber: 14
    });

    saveAttendance(yesterdayStr, ['std_demo_2']);

    // تسجيل تسميع تجريبي (يبدأ من سورة النبأ 78 صعوداً للأعلى)
    saveStudentRecitation('std_demo_1', 78);
    saveStudentRecitation('std_demo_1', 79);
    saveStudentRecitation('std_demo_2', 78);
    saveStudentRecitation('std_demo_4', 78);
    saveStudentRecitation('std_demo_4', 79);
    saveStudentRecitation('std_demo_4', 80);
    saveStudentRecitation('std_demo_4', 81);
}


// -------------------------------------------------------------
// إدارة النسخ الاحتياطي وتصدير واستيراد البيانات بالكامل
// -------------------------------------------------------------


// -------------------------------------------------------------
// إدارة ومتابعة اختبارات الطلاب (Exams Management)
// -------------------------------------------------------------

function getAllExams() {
  return safeGet(STORAGE_KEYS.EXAMS, {});
}

function getStudentExams(studentId) {
  const all = getAllExams();
  const list = all[studentId] || [];
  return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.timestamp || '').localeCompare(a.timestamp || ''));
}

function getLatestStudentExam(studentId) {
  const list = getStudentExams(studentId);
  return list.length > 0 ? list[0] : null;
}

function saveStudentExam(studentId, examData) {
  const all = getAllExams();
  if (!all[studentId]) {
    all[studentId] = [];
  }
  const newExam = {
    id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    examName: examData.examName.trim(),
    result: examData.result.trim(),
    date: normalizeToIsoDate(examData.date) || getTodayStr(),
    notes: (examData.notes || '').trim(),
    timestamp: new Date().toISOString()
  };
  all[studentId].push(newExam);
  safeSet(STORAGE_KEYS.EXAMS, all);
  return newExam;
}

function deleteStudentExam(studentId, examId) {
  const all = getAllExams();
  if (all[studentId]) {
    all[studentId] = all[studentId].filter(e => e.id !== examId);
    safeSet(STORAGE_KEYS.EXAMS, all);
    return true;
  }
  return false;
}

function exportAllDataJSON() {
  const backup = {
    app: 'wartel',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    students: getStudents(),
    sessions: getAllSessions(),
    attendance: getAllAttendance(),
    recitations: getAllRecitations(),
    exams: getAllExams(),
    theme: getTheme()
  };
  return JSON.stringify(backup, null, 2);
}

function importAllDataJSON(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'ملف النسخة الاحتياطية غير صالح.' };
    }
    if (Array.isArray(data.students)) {
      safeSet(STORAGE_KEYS.STUDENTS, data.students);
    }
    if (data.sessions && typeof data.sessions === 'object') {
      safeSet(STORAGE_KEYS.SESSIONS, data.sessions);
    }
    if (data.attendance && typeof data.attendance === 'object') {
      safeSet(STORAGE_KEYS.ATTENDANCE, data.attendance);
    }
    if (data.recitations && typeof data.recitations === 'object') {
      safeSet(STORAGE_KEYS.RECITATIONS, data.recitations);
    }
    if (data.exams && typeof data.exams === 'object') {
      safeSet(STORAGE_KEYS.EXAMS, data.exams);
    }
    if (data.theme) {
      saveTheme(data.theme);
    }
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message || 'خطأ أثناء استيراد البيانات' };
  }
}

function resetToDemoData() {
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
  localStorage.removeItem(STORAGE_KEYS.RECITATIONS);
  localStorage.removeItem(STORAGE_KEYS.EXAMS);
  initDemoDataIfEmpty();
}

// -------------------------------------------------------------
// إدارة التذكير الدوري بالنسخ الاحتياطي (كل 30 يوماً)
// -------------------------------------------------------------

function markBackupCompleted() {
  const now = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now);
  localStorage.removeItem(STORAGE_KEYS.POSTPONE_BACKUP);
}

function postponeBackupReminder(days = 7) {
  const postponeUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  localStorage.setItem(STORAGE_KEYS.POSTPONE_BACKUP, postponeUntil);
}

function shouldShowBackupReminder() {
  const students = getStudents();
  // لا نظهر التنبيه إذا لم يكن هناك طلاب أصلاً
  if (students.length === 0) return false;

  // فحص تاريخ التأجيل إن وجد
  const postponeDateStr = localStorage.getItem(STORAGE_KEYS.POSTPONE_BACKUP);
  if (postponeDateStr) {
    const postponeDate = new Date(postponeDateStr).getTime();
    if (Date.now() < postponeDate) {
      return false; // لا يزال في فترة التأجيل
    }
  }

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // فحص تاريخ آخر نسخة احتياطية
  const lastBackupStr = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
  if (lastBackupStr) {
    const lastBackupTime = new Date(lastBackupStr).getTime();
    return (Date.now() - lastBackupTime) >= THIRTY_DAYS_MS;
  }

  // إذا لم يتم عمل أي نسخة احتياطية مسبقاً، نفحص تاريخ أول تشغيل
  let firstRunStr = localStorage.getItem(STORAGE_KEYS.FIRST_RUN);
  if (!firstRunStr) {
    firstRunStr = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.FIRST_RUN, firstRunStr);
    return false; // لا نزعج المستخدم في أول شهر من التثبيت
  }

  const firstRunTime = new Date(firstRunStr).getTime();
  return (Date.now() - firstRunTime) >= THIRTY_DAYS_MS;
}

function getExamCardModel() {
  return localStorage.getItem(STORAGE_KEYS.EXAM_CARD_MODEL) || 'model-1';
}
function setExamCardModel(m) {
  localStorage.setItem(STORAGE_KEYS.EXAM_CARD_MODEL, m);
}

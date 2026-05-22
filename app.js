const state = {
  data: {},
  allCourses: [],
  selectedSemester: null,
  selectedCourse: null,
};

const ui = {
  loading: document.getElementById('loading'),
  semesterView: document.getElementById('semester-view'),
  courseView: document.getElementById('course-view'),
  fileView: document.getElementById('file-view'),
  semesterGrid: document.getElementById('semester-grid'),
  semesterCount: document.getElementById('semester-count'),
  courseList: document.getElementById('course-list'),
  courseViewTitle: document.getElementById('course-view-title'),
  courseViewCount: document.getElementById('course-view-count'),
  courseTitle: document.getElementById('course-title'),
  courseDescription: document.getElementById('course-description'),
  fileCount: document.getElementById('file-count'),
  fileList: document.getElementById('file-list'),
  searchInput: document.getElementById('search-input'),
  searchResults: document.getElementById('search-results'),
  themeToggle: document.getElementById('theme-toggle'),
  contactForm: document.getElementById('contact-form'),
  formStatus: document.getElementById('form-status'),
  year: document.getElementById('year'),
  crumbHome: document.getElementById('crumb-home'),
  crumbSemester: document.getElementById('crumb-semester'),
  crumbSemesterSep: document.getElementById('crumb-semester-sep'),
  crumbCourse: document.getElementById('crumb-course'),
  homeLink: document.getElementById('home-link'),
};

const escapeHtml = (text = '') => text
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function detectFileType(type = '') {
  const normalized = type.toLowerCase();
  if (normalized.includes('pdf')) return { icon: 'PDF', label: 'PDF' };
  if (normalized.includes('doc')) return { icon: 'DOC', label: 'Word' };
  if (normalized.includes('xls')) return { icon: 'XLS', label: 'Excel' };
  if (normalized.includes('ppt')) return { icon: 'PPT', label: 'Slides' };
  if (normalized.includes('mp4') || normalized.includes('video')) return { icon: 'VID', label: 'Video' };
  if (normalized.includes('zip')) return { icon: 'ZIP', label: 'Archive' };
  return { icon: 'FILE', label: 'File' };
}

function applyTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark', saved === 'dark');
  ui.themeToggle.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const next = document.body.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme();
}

function buildAllCourses() {
  state.allCourses = Object.entries(state.data).flatMap(([semesterKey, courses]) => {
    const semesterNumber = semesterKey.replace('semester_', '');
    const semesterLabel = `Semester ${semesterNumber}`;
    return courses.map((course) => ({ ...course, semesterKey, semesterLabel }));
  });
}

function setView(view) {
  ui.semesterView.hidden = view !== 'semesters';
  ui.courseView.hidden = view !== 'courses';
  ui.fileView.hidden = view !== 'files';
}

function updateBreadcrumb() {
  ui.crumbSemester.hidden = !state.selectedSemester;
  ui.crumbSemesterSep.hidden = !state.selectedSemester;
  ui.crumbCourse.hidden = !state.selectedCourse;

  ui.crumbHome.classList.toggle('active', !state.selectedSemester && !state.selectedCourse);

  if (state.selectedSemester) {
    ui.crumbSemester.textContent = `Semester ${state.selectedSemester.replace('semester_', '')}`;
    ui.crumbSemester.classList.toggle('active', !state.selectedCourse);
  }

  if (state.selectedCourse) {
    ui.crumbCourse.textContent = state.selectedCourse.name;
    ui.crumbCourse.classList.add('active');
  }
}

function renderSemesters() {
  setView('semesters');
  state.selectedSemester = null;
  state.selectedCourse = null;
  updateBreadcrumb();

  const entries = Object.entries(state.data);
  ui.semesterCount.textContent = `${entries.length} semesters available`;
  ui.semesterGrid.innerHTML = entries.map(([key, courses]) => {
    const number = key.replace('semester_', '');
    return `
      <article class="semester-card" data-semester="${key}">
        <h3>Semester ${number}</h3>
        <p class="meta">${courses.length} courses</p>
      </article>
    `;
  }).join('');

  ui.semesterGrid.querySelectorAll('.semester-card').forEach((card) => {
    card.addEventListener('click', () => renderCourses(card.dataset.semester));
  });
}

function renderCourses(semesterKey) {
  state.selectedSemester = semesterKey;
  state.selectedCourse = null;
  updateBreadcrumb();
  setView('courses');

  const courses = state.data[semesterKey] ?? [];
  const semesterNumber = semesterKey.replace('semester_', '');

  ui.courseViewTitle.textContent = `Semester ${semesterNumber} Courses`;
  ui.courseViewCount.textContent = `${courses.length} courses`;

  ui.courseList.innerHTML = courses.map((course) => `
    <article class="course-card" data-course-id="${course.id}">
      <h3>${course.id} — ${escapeHtml(course.name)}</h3>
      <p class="meta">${escapeHtml(course.description)}</p>
      <p class="meta">${course.files.length} files</p>
    </article>
  `).join('');

  ui.courseList.querySelectorAll('.course-card').forEach((card) => {
    card.addEventListener('click', () => {
      const course = courses.find((item) => item.id === card.dataset.courseId);
      if (course) renderFiles(course);
    });
  });
}

function renderFiles(course) {
  state.selectedCourse = course;
  updateBreadcrumb();
  setView('files');

  ui.courseTitle.textContent = `${course.id} — ${course.name}`;
  ui.courseDescription.textContent = course.description;
  ui.fileCount.textContent = `${course.files.length} file(s)`;

  ui.fileList.innerHTML = course.files.map((file) => {
    const kind = detectFileType(file.type);
    return `
      <article class="file-card">
        <div class="file-row">
          <div class="file-left">
            <div class="file-icon" title="${kind.label}">${kind.icon}</div>
            <div>
              <p><strong>${escapeHtml(file.name)}</strong></p>
              <p class="meta">${escapeHtml(file.type)} • ${escapeHtml(file.size)}</p>
            </div>
          </div>
          <a class="file-link" href="${escapeHtml(file.url)}" target="_blank" rel="noopener noreferrer">Open</a>
        </div>
      </article>
    `;
  }).join('');
}

function highlight(text, query) {
  const safeText = escapeHtml(text);
  if (!query.trim()) return safeText;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'ig');
  return safeText.replace(regex, '<mark>$1</mark>');
}

function renderSearchResults(query) {
  if (!query.trim()) {
    ui.searchResults.innerHTML = '';
    return;
  }

  const q = query.toLowerCase();
  const matches = state.allCourses
    .filter((course) => (
      `${course.id} ${course.name} ${course.description} ${course.semesterLabel}`
        .toLowerCase()
        .includes(q)
    ))
    .slice(0, 12);

  if (!matches.length) {
    ui.searchResults.innerHTML = '<p class="meta">No matching courses found.</p>';
    return;
  }

  ui.searchResults.innerHTML = matches.map((course) => `
    <button type="button" class="search-item" data-semester="${course.semesterKey}" data-course-id="${course.id}">
      <p><strong>${highlight(course.id, query)} — ${highlight(course.name, query)}</strong></p>
      <p class="meta">${highlight(course.semesterLabel, query)} • ${highlight(course.description, query)}</p>
    </button>
  `).join('');

  ui.searchResults.querySelectorAll('.search-item').forEach((button) => {
    button.addEventListener('click', () => {
      const semesterKey = button.dataset.semester;
      const courses = state.data[semesterKey] || [];
      const course = courses.find((item) => item.id === button.dataset.courseId);
      if (!course) return;
      renderCourses(semesterKey);
      renderFiles(course);
      ui.searchInput.value = '';
      ui.searchResults.innerHTML = '';
    });
  });
}

async function handleFormSubmit(event) {
  event.preventDefault();
  ui.formStatus.textContent = 'Sending...';

  try {
    const formData = new FormData(ui.contactForm);
    const response = await fetch(ui.contactForm.action, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error('Failed to send');

    ui.contactForm.reset();
    ui.formStatus.textContent = 'Thanks! Your message has been sent.';
  } catch (error) {
    ui.formStatus.textContent = 'Formspree is not connected yet. Replace the form action URL and try again.';
  }
}

async function init() {
  applyTheme();
  ui.year.textContent = new Date().getFullYear();

  ui.themeToggle.addEventListener('click', toggleTheme);
  ui.searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
  ui.contactForm.addEventListener('submit', handleFormSubmit);

  ui.crumbHome.addEventListener('click', renderSemesters);
  ui.crumbSemester.addEventListener('click', () => {
    if (state.selectedSemester) renderCourses(state.selectedSemester);
  });
  ui.homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    renderSemesters();
  });

  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('Unable to load data.json');
    state.data = await response.json();
  } catch (error) {
    ui.loading.innerHTML = '<p>Could not load course data. Please ensure `data.json` is present when hosted.</p>';
    return;
  }

  buildAllCourses();
  ui.loading.hidden = true;
  renderSemesters();
}

init();

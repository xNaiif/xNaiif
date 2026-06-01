const state = {
  data: {},
  allCourses: [],
  selectedSemester: null,
  selectedCourse: null,
};
const MAX_SEARCH_RESULTS = 12;

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
  submitBtn: document.querySelector('#contact-form button[type=\"submit\"]'),
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

const CATEGORY_ORDER = [
  '📚 Chapters / Lecture Notes',
  '📝 Assignments',
  '📊 Exams / Tests',
  '🎥 Videos',
  '📦 Resources',
];

function getCourseFiles(course) {
  return Array.isArray(course?.files) ? course.files : [];
}

function groupFilesByCategory(files) {
  const grouped = new Map();

  files.forEach((file) => {
    const category = file.category || '📦 Resources';
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(file);
  });

  return [...grouped.entries()]
    .sort(([a], [b]) => {
      const aIndex = CATEGORY_ORDER.indexOf(a);
      const bIndex = CATEGORY_ORDER.indexOf(b);
      return (aIndex === -1 ? CATEGORY_ORDER.length : aIndex) - (bIndex === -1 ? CATEGORY_ORDER.length : bIndex);
    })
    .map(([name, categoryFiles]) => ({ name, files: categoryFiles }));
}

function buildFileViewerUrl(course, file) {
  const params = new URLSearchParams({
    course: `${course.id} — ${course.name}`,
    name: file.name || '',
    type: file.type || '',
    size: file.size || '',
    date: file.date || '',
    category: file.category || '📦 Resources',
    url: file.url || '',
  });

  return `file-viewer.html?${params.toString()}`;
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
      <p class="meta">${getCourseFiles(course).length} files</p>
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

  const files = getCourseFiles(course);
  const groupedFiles = groupFilesByCategory(files);

  ui.courseTitle.textContent = `${course.id} — ${course.name}`;
  ui.courseDescription.textContent = course.description;
  ui.fileCount.textContent = `${files.length} file(s)`;

  ui.fileList.innerHTML = groupedFiles.map((categoryGroup) => `
    <section class="file-category">
      <div class="file-category-header">
        <h4>${escapeHtml(categoryGroup.name)}</h4>
        <span class="meta">${categoryGroup.files.length} file(s)</span>
      </div>
      <div class="file-category-list">
        ${categoryGroup.files.map((file) => {
    const kind = detectFileType(file.type);
    return `
          <article class="file-card">
            <div class="file-row">
              <div class="file-left">
                <div class="file-icon" title="${kind.label}">${kind.icon}</div>
                <div>
                  <p><strong>${escapeHtml(file.name)}</strong></p>
                  <p class="meta">${escapeHtml(file.type)} • ${escapeHtml(file.size)} • ${escapeHtml(file.date || 'N/A')}</p>
                </div>
              </div>
              <a class="file-link" href="${buildFileViewerUrl(course, file)}">View</a>
            </div>
          </article>
        `;
  }).join('')}
      </div>
    </section>
  `).join('');
}

function highlight(text, query) {
  const value = String(text ?? '');
  if (!query.trim()) return escapeHtml(value);

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'ig');
  const parts = value.split(regex);
  const matches = value.match(regex) || [];
  let result = '';

  for (let i = 0; i < parts.length; i += 1) {
    result += escapeHtml(parts[i]);
    if (i < matches.length) {
      result += `<mark>${escapeHtml(matches[i])}</mark>`;
    }
  }

  return result;
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
    .slice(0, MAX_SEARCH_RESULTS);

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

  if (ui.contactForm.action.endsWith('#')) {
    ui.formStatus.textContent = 'Please set your Formspree form ID in index.html before submitting.';
    return;
  }

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
    ui.formStatus.textContent = 'Failed to send message. Please check your connection and try again.';
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

  if (ui.contactForm.action.endsWith('#')) {
    ui.formStatus.textContent = 'Form is in setup mode. Add your Formspree form ID to enable submissions.';
    ui.submitBtn.disabled = true;
    ui.submitBtn.title = 'Configure Formspree form ID first';
  }

  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    state.data = await response.json();
  } catch (error) {
    if (String(error.message).startsWith('HTTP_')) {
      ui.loading.textContent = 'Could not load course data because data.json was not found on the server.';
    } else {
      ui.loading.textContent = 'Could not load course data. If you opened this page with file://, start a local server (for example: python -m http.server) or host on GitHub Pages.';
    }
    return;
  }

  buildAllCourses();
  ui.loading.hidden = true;
  renderSemesters();
}

init();

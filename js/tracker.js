export class DailyTaskTracker {
  constructor(
    tasks = {
      Basic: ['Exercises', 'Reading', 'Learn an expression', 'Diet'],
      Music: ['Learn songs', 'Practice singing']
    }
  ) {
    this.tasks = tasks;
    this.cookieName = 'daily_tasks_status';
    this.init();
  }

  init() {
    this.createUI();
    this.loadState();
    this.attachEvents();
  }

  createUI() {
    // Floating Checklist Icon Button
    this.floatBtn = document.createElement('div');
    this.floatBtn.className =
      'fixed bottom-6 right-6 w-14 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer z-50 transition-all duration-200 hover:scale-105';
    this.floatBtn.innerHTML = `<i class="fa-solid fa-list-check text-xl"></i>`;

    // Pop-up Card
    this.popup = document.createElement('div');
    this.popup.className =
      'fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 hidden flex-col z-50 overflow-hidden font-sans';

    const header = document.createElement('div');
    header.className =
      'bg-slate-900 text-white px-4 py-3 flex justify-between items-center text-xs font-bold';
    header.innerHTML = `
      <span class="flex items-center gap-2"><i class="fa-solid fa-list-check text-rose-500"></i> Daily Tasks</span>
      <span class="task-popup-close cursor-pointer text-slate-400 hover:text-white text-base">&times;</span>
    `;

    const container = document.createElement('div');
    container.className =
      'p-4 space-y-4 max-h-80 overflow-y-auto custom-scrollbar';

    // Render tasks grouped by sections
    let taskIndex = 0;
    Object.entries(this.tasks).forEach(([section, taskList]) => {
      const sectionDiv = document.createElement('div');

      const sectionTitle = document.createElement('h4');
      sectionTitle.className =
        'text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1';
      sectionTitle.textContent = section;

      const ul = document.createElement('ul');
      ul.className = 'space-y-1';

      taskList.forEach((task) => {
        const id = `task-${taskIndex++}`;
        const li = document.createElement('li');
        li.className =
          'flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer';
        li.innerHTML = `
          <div class="flex items-center gap-3">
            <input type="checkbox" id="${id}" data-task="${task}" class="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer">
            <label for="${id}" class="text-xs font-medium text-slate-700 cursor-pointer select-none">${task}</label>
          </div>
        `;
        ul.appendChild(li);
      });

      sectionDiv.appendChild(sectionTitle);
      sectionDiv.appendChild(ul);
      container.appendChild(sectionDiv);
    });

    this.popup.appendChild(header);
    this.popup.appendChild(container);

    document.body.appendChild(this.floatBtn);
    document.body.appendChild(this.popup);
  }

  attachEvents() {
    this.floatBtn.addEventListener('click', () => {
      if (this.popup.classList.contains('hidden')) {
        this.popup.classList.remove('hidden');
        this.popup.classList.add('flex');
      } else {
        this.popup.classList.remove('flex');
        this.popup.classList.add('hidden');
      }
    });

    this.popup
      .querySelector('.task-popup-close')
      .addEventListener('click', () => {
        this.popup.classList.remove('flex');
        this.popup.classList.add('hidden');
      });

    const checkboxes = this.popup.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((chk) => {
      chk.addEventListener('change', () => this.saveState());
    });
  }

  getTodayDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  saveState() {
    const checkboxes = this.popup.querySelectorAll('input[type="checkbox"]');
    const checkedTasks = {};

    checkboxes.forEach((chk) => {
      checkedTasks[chk.dataset.task] = chk.checked;
    });

    const data = {
      date: this.getTodayDateString(),
      tasks: checkedTasks
    };

    const expires = new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000
    ).toUTCString();
    document.cookie = `${this.cookieName}=${encodeURIComponent(
      JSON.stringify(data)
    )}; expires=${expires}; path=/`;
  }

  loadState() {
    const cookieValue = this.getCookie(this.cookieName);
    if (!cookieValue) return;

    try {
      const data = JSON.parse(decodeURIComponent(cookieValue));
      const today = this.getTodayDateString();

      if (data.date !== today) return;

      const checkboxes = this.popup.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((chk) => {
        const taskName = chk.dataset.task;
        if (data.tasks && data.tasks[taskName]) {
          chk.checked = true;
        }
      });
    } catch (e) {
      console.error('Failed to parse task cookie state:', e);
    }
  }

  getCookie(name) {
    const match = document.cookie.match(
      new RegExp('(^| )' + name + '=([^;]+)')
    );
    return match ? match[2] : null;
  }
}

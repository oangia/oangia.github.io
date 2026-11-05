export class DailyTaskTracker extends WidgetU {
  constructor(
    tasks = {
      Basic: ['Exercises', { name: 'Reading', type: 'weekly' }, 'Learn an expression', 'Diet'],
      Music: ['Learn songs', 'Practice singing']
    },
    options = {}
  ) {
    super({
      ...options,
      floatBtn: {
        icon: 'fa-solid fa-list-check',
        bg: 'bg-rose-600 hover:bg-rose-700'
      }
    });
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
    // 2. Create the pop-up card
    this.popup = document.createElement('div');
    this.popup.className =
      'absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 hidden flex-col z-50 overflow-hidden font-sans';

    const header = document.createElement('div');
    header.className =
      'bg-slate-900 text-white px-4 py-3 flex justify-between items-center text-xs font-bold';
    header.innerHTML = `
      <span class="flex items-center gap-2"><i class="fa-solid fa-list-check text-rose-500"></i> Tasks Tracker</span>
      <span class="task-popup-close cursor-pointer text-slate-400 hover:text-white text-base">&times;</span>
    `;

    const container = document.createElement('div');
    container.className =
      'p-4 space-y-4 max-h-80 overflow-y-auto custom-scrollbar';

    let taskIndex = 0;
    Object.entries(this.tasks).forEach(([section, taskList]) => {
      const sectionDiv = document.createElement('div');

      const sectionTitle = document.createElement('h4');
      sectionTitle.className =
        'text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1';
      sectionTitle.textContent = section;

      const ul = document.createElement('ul');
      ul.className = 'space-y-1';

      taskList.forEach((taskItem) => {
        // Handle both string format (daily) and object format ({ name, type })
        const taskName = typeof taskItem === 'string' ? taskItem : taskItem.name;
        const taskType = typeof taskItem === 'string' ? 'daily' : (taskItem.type || 'daily');

        const id = `task-${this.id}-${taskIndex++}`;
        const li = document.createElement('li');
        li.className =
          'flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer';
        li.innerHTML = `
          <div class="flex items-center gap-3">
            <input type="checkbox" id="${id}" data-task="${taskName}" data-type="${taskType}" class="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer">
            <label for="${id}" class="text-xs font-medium text-slate-700 cursor-pointer select-none">
              ${taskName} ${taskType === 'weekly' ? '<span class="text-[9px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded ml-1">Weekly</span>' : ''}
            </label>
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

    // Append pop-up to wrapper
    this.wrapper.appendChild(this.popup);

    // 3. Bind toggle behavior using the parent method
    this.bindToggle(this.popup, '.task-popup-close');
  }

  attachEvents() {
    const checkboxes = this.popup.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((chk) => {
      chk.addEventListener('change', () => this.saveState());
    });
  }

  getTodayDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  getWeekKey() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${weekNo}`;
  }

  saveState() {
    const checkboxes = this.popup.querySelectorAll('input[type="checkbox"]');
    
    // Load existing state from cookie first so we don't wipe out daily when saving weekly, or vice versa
    let existingData = {};
    const cookieValue = this.getCookie(this.cookieName);
    if (cookieValue) {
      try {
        existingData = JSON.parse(decodeURIComponent(cookieValue));
      } catch (e) {}
    }

    const dailyTasks = existingData.dailyTasks || {};
    const weeklyTasks = existingData.weeklyTasks || {};

    const currentDailyDate = this.getTodayDateString();
    const currentWeekKey = this.getWeekKey();

    // Reset or initialize if date/week changed
    const savedDailyDate = existingData.dailyDate;
    const savedWeekKey = existingData.weekKey;

    const activeDaily = savedDailyDate === currentDailyDate ? dailyTasks : {};
    const activeWeekly = savedWeekKey === currentWeekKey ? weeklyTasks : {};

    checkboxes.forEach((chk) => {
      const taskName = chk.dataset.task;
      const taskType = chk.dataset.type;

      if (taskType === 'weekly') {
        activeWeekly[taskName] = chk.checked;
      } else {
        activeDaily[taskName] = chk.checked;
      }
    });

    const data = {
      dailyDate: currentDailyDate,
      weekKey: currentWeekKey,
      dailyTasks: activeDaily,
      weeklyTasks: activeWeekly
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
      const currentWeek = this.getWeekKey();

      const checkboxes = this.popup.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((chk) => {
        const taskName = chk.dataset.task;
        const taskType = chk.dataset.type;

        if (taskType === 'weekly') {
          if (data.weekKey === currentWeek && data.weeklyTasks && data.weeklyTasks[taskName]) {
            chk.checked = true;
          }
        } else {
          if (data.dailyDate === today && data.dailyTasks && data.dailyTasks[taskName]) {
            chk.checked = true;
          }
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

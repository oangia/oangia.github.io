export class Widget {
  constructor(options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 9);
    this.createLayout();
  }
  
  loadDependencies() { }
  createUI() {}

  createLayout() {
    let container = document.getElementById('floating-widgets-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'floating-widgets-container';
      container.className = 'fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50 font-sans';
      document.body.appendChild(container);
    }
    this.widgetContainer = container;

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'relative flex flex-col items-end';
    this.widgetContainer.appendChild(this.wrapper);
  }

  // Parent handles creating the trigger button and shared toggle logic
  createFloatButton(iconHtml, bgClasses = 'bg-rose-600 hover:bg-rose-700') {
    this.floatBtn = document.createElement('button');
    this.floatBtn.type = 'button';
    this.floatBtn.className = `w-14 h-14 ${bgClasses} text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer transition-all duration-200 hover:scale-105`;
    this.floatBtn.innerHTML = iconHtml;

    this.wrapper.appendChild(this.floatBtn);
  }

  // Shared toggle behavior for the pop-up/modal element
  bindToggle(popupElement, closeSelector = null) {
    this.popup = popupElement;

    this.floatBtn.addEventListener('click', () => {
      if (this.popup.classList.contains('hidden')) {
        this.popup.classList.remove('hidden');
        this.popup.classList.add('flex');
      } else {
        this.popup.classList.remove('flex');
        this.popup.classList.add('hidden');
      }
    });

    if (closeSelector) {
      const closeBtn = this.popup.querySelector(closeSelector);
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.popup.classList.remove('flex');
          this.popup.classList.add('hidden');
        });
      }
    }
  }
}
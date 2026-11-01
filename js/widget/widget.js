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
}

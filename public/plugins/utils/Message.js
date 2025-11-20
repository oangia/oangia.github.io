class Message {
  static el = null;
  static timeout = null;

  static create() {
    if (this.el) return;

    const div = document.createElement('div');
    div.className = 'message-floating';
    Object.assign(div.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      minWidth: '200px',
      padding: '12px 16px',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      color: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      opacity: 0,
      transition: 'opacity 0.3s',
    });

    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    Object.assign(closeBtn.style, {
      marginLeft: '12px',
      fontWeight: 'bold',
      cursor: 'pointer',
    });
    closeBtn.addEventListener('click', () => this.hide());

    div.appendChild(closeBtn);
    document.body.appendChild(div);

    this.el = div;
  }

  static show(text, type = 'info', duration = 3000) {
    this.create();

    if (this.el.firstChild && this.el.firstChild !== this.el.lastChild) {
      this.el.removeChild(this.el.firstChild);
    }

    const textNode = document.createElement('span');
    textNode.textContent = text;
    this.el.insertBefore(textNode, this.el.lastChild);

    switch(type) {
      case 'success': this.el.style.backgroundColor = '#28a745'; break;
      case 'error': this.el.style.backgroundColor = '#dc3545'; break;
      case 'warning': 
        this.el.style.backgroundColor = '#ffc107'; 
        this.el.style.color = '#000';
        break;
      default: this.el.style.backgroundColor = '#17a2b8'; break;
    }

    this.el.style.display = 'flex';
    requestAnimationFrame(() => this.el.style.opacity = 1);

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.hide(), duration);
  }

  static hide() {
    if (!this.el) return;
    this.el.style.opacity = 0;
    setTimeout(() => this.el && (this.el.style.display = 'none'), 300);
  }

  // Helper methods by type
  static success(text, duration = 3000) { this.show(text, 'success', duration); }
  static error(text, duration = 3000) { this.show(text, 'error', duration); }
  static warning(text, duration = 3000) { this.show(text, 'warning', duration); }
  static info(text, duration = 3000) { this.show(text, 'info', duration); }
}

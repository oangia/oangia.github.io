class Loading {
    static start() {
      if (document.getElementById('loading-overlay')) return;
  
      const overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '9999'
      });
  
      const dots = document.createElement('div');
      dots.style.display = 'flex';
      dots.style.gap = '10px';
  
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.style.width = '15px';
        dot.style.height = '15px';
        dot.style.backgroundColor = '#10a37f';
        dot.style.borderRadius = '50%';
        dot.style.animation = `dots 1.2s infinite ${i * 0.2}s`;
        dots.appendChild(dot);
      }
  
      overlay.appendChild(dots);
      document.body.appendChild(overlay);
  
      if (!document.getElementById('loading-style')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'loading-style';
        styleEl.innerHTML = `
          @keyframes dots {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
        `;
        document.head.appendChild(styleEl);
      }
    }
  
    static end() {
      const overlay = document.getElementById('loading-overlay');
      if (overlay) overlay.remove();
    }
  }
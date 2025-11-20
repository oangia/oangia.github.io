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

    const ripple = document.createElement('div');
    ripple.className = 'ripple-loader';
    overlay.appendChild(ripple);
    document.body.appendChild(overlay);

    if (!document.getElementById('loading-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'loading-style';
      styleEl.innerHTML = `
        .ripple-loader {
          position: relative;
          width: 80px;
          height: 80px;
        }

        /* First ripple: green */
        .ripple-loader::before {
          content: "";
          position: absolute;
          border: 4px solid #10a37f;
          border-radius: 50%;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          animation: ripple 1s infinite ease-out;
        }

        /* Second ripple: red, hidden initially */
        .ripple-loader::after {
          content: "";
          position: absolute;
          border: 4px solid #d20962;
          border-radius: 50%;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          opacity: 0; /* hide initially */
          animation: ripple 1s infinite ease-out;
          animation-delay: 0.5s; /* staggered start */
        }

        @keyframes ripple {
          0% {
            transform: scale(0.2);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
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
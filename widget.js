(function() {
    'use strict';

    if (window.location.href.includes("oangia.github.io")) return;

    const EXPLORER_URL = "https://oangia.github.io";

    // ==========================================
    // STYLES
    // ==========================================
    const style = document.createElement('style');
    style.textContent = `
        #floating-widgets-container, #transparent-fullscreen-overlay {
            z-index: 999999;
            display: flex;
            font-family: Roboto, Arial, sans-serif;
        }
        #floating-widgets-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            flex-direction: column;
            align-items: flex-end;
            gap: 12px;
            box-sizing: border-box;
        }
        #floating-widgets-container *, #floating-widgets-container ::after, #floating-widgets-container ::before {
            box-sizing: border-box;
        }
        .widget-wrapper {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        .widget-float-btn {
            width: 52px;
            height: 52px;
            background-color: #4f46e5;
            color: #fff;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px rgba(0, 0, 0, .25);
            cursor: pointer;
            transition: transform .2s cubic-bezier(.4, 0, .2, 1), background-color .2s, box-shadow .2s;
        }
        .widget-float-btn:hover {
            background-color: #4338ca;
            transform: scale(1.08);
            box-shadow: 0 12px 28px rgba(0, 0, 0, .35);
        }
        .widget-float-btn svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }
        #transparent-fullscreen-overlay {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            background: transparent !important;
            z-index: 1000000;
        }
        #transparent-fullscreen-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: transparent !important;
        }
        #transparent-fullscreen-close {
            position: fixed;
            top: 16px;
            right: 16px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.4);
            background: rgba(15, 23, 42, 0.75);
            color: #fff;
            font-size: 18px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            backdrop-filter: blur(6px);
            z-index: 1000001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            transition: transform 0.15s, background-color 0.15s;
        }
        #transparent-fullscreen-close:hover {
            background: rgba(225, 29, 72, 0.9);
            transform: scale(1.08);
        }
    `;
    document.head.appendChild(style);

    // ==========================================
    // CREATE DOM ELEMENTS
    // ==========================================
    const container = document.createElement('div');
    container.id = 'floating-widgets-container';
    document.body.appendChild(container);

    // Storage Explorer Button
    const explorerWrapper = document.createElement('div');
    explorerWrapper.className = 'widget-wrapper';
    container.appendChild(explorerWrapper);

    const explorerBtn = document.createElement('button');
    explorerBtn.type = 'button';
    explorerBtn.title = 'Open Storage Explorer (Fullscreen)';
    explorerBtn.className = 'widget-float-btn';
    explorerBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>`;
    explorerWrapper.appendChild(explorerBtn);
    explorerBtn.addEventListener('click', toggleTransparentFullscreen);

    // ==========================================
    // FULLSCREEN HANDLER
    // ==========================================
    function toggleTransparentFullscreen() {
        const existing = document.getElementById('transparent-fullscreen-overlay');
        if (existing) { existing.remove(); return; }

        const overlay = document.createElement('div');
        overlay.id = 'transparent-fullscreen-overlay';

        const fsIframe = document.createElement('iframe');
        fsIframe.id = 'transparent-fullscreen-iframe';
        fsIframe.src = EXPLORER_URL;
        fsIframe.setAttribute('allowtransparency', 'true');

        const closeBtn = document.createElement('button');
        closeBtn.id = 'transparent-fullscreen-close';
        closeBtn.type = 'button';
        closeBtn.title = 'Close (Esc)';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => overlay.remove();

        overlay.appendChild(fsIframe);
        overlay.appendChild(closeBtn);
        document.body.appendChild(overlay);
    }

    // ==========================================
    // SHORTCUTS
    // ==========================================
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const fsOverlay = document.getElementById('transparent-fullscreen-overlay');
            if (fsOverlay) fsOverlay.remove();
        }
    });
})();

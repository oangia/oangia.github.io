/**
 * AuthModal - Handles modal show/hide with animations
 */
export class AuthModal {
    constructor(modalOverlayId = 'auth-modal-overlay') {
        this.modalOverlayId = modalOverlayId;
    }

    show() {
        const modalOverlay = document.getElementById(this.modalOverlayId);
        if (modalOverlay) {
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
            
            // Show overlay first
            modalOverlay.style.display = 'flex';
            
            // Trigger fade in animation
            requestAnimationFrame(() => {
                modalOverlay.classList.add('show');
            });
        }
    }

    hide() {
        const modalOverlay = document.getElementById(this.modalOverlayId);
        if (modalOverlay) {
            // Remove show class to trigger fade out
            modalOverlay.classList.remove('show');
            
            // Hide after animation completes
            setTimeout(() => {
                modalOverlay.style.display = 'none';
                document.body.style.overflow = ''; // Restore scrolling
            }, 300); // Match transition duration
        }
    }

    create(htmlContent) {
        const modal = document.createElement('div');
        modal.id = this.modalOverlayId;
        modal.className = 'auth-modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header d-flex justify-content-between align-items-center">
                    <h2 class="mb-0">Login</h2>
                    <button id="auth-modal-close" type="button" class="btn-close" aria-label="Close"></button>
                </div>
                <div class="auth-modal-body">
                    ${htmlContent}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Set up close button
        const closeBtn = document.getElementById('auth-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hide();
            }
        });

        return modal;
    }
}


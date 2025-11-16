/**
 * AuthStyles - Injects CSS styles for auth UI
 */
export class AuthStyles {
    static inject() {
        // Check if styles already injected
        if (document.getElementById('firebase-auth-ui-styles')) return;

        const style = document.createElement('style');
        style.id = 'firebase-auth-ui-styles';
        style.textContent = `
            .auth-ui {
                width: 100%;
            }

            .auth-message {
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 14px;
                display: none;
            }

            .auth-message.show {
                display: block;
            }

            .auth-message-success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .auth-message-error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .auth-form {
                width: 100%;
            }

            /* Custom styles for Bootstrap overrides */
            .form-control:focus {
                border-color: #14b8a6;
                box-shadow: 0 0 0 0.25rem rgba(20, 184, 166, 0.25);
            }

            .btn-primary {
                background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
                border: none;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(20, 184, 166, 0.4);
                background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
            }

            .btn-social {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                background: white;
                border: 2px solid #e0e0e0;
                color: #333;
            }

            .btn-social:hover {
                background: #f5f5f5;
            }

            .btn-google {
                border-color: #db4437;
                color: #db4437;
            }

            .btn-facebook {
                border-color: #4267B2;
                color: #4267B2;
            }

            .auth-divider {
                display: flex;
                align-items: center;
                margin: 20px 0;
                color: #999;
                font-size: 14px;
            }

            .auth-divider::before,
            .auth-divider::after {
                content: '';
                flex: 1;
                height: 1px;
                background: #e0e0e0;
            }

            .auth-divider span {
                padding: 0 15px;
            }

            .auth-links a {
                color: #14b8a6;
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
            }

            .auth-links a:hover {
                text-decoration: underline;
                color: #10b981;
            }

            .user-avatar {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                margin: 0 auto 10px;
                background: #14b8a6;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 28px;
                font-weight: bold;
            }

            .auth-toggle-btn {
                background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                margin-bottom: 20px;
                width: 100%;
            }

            .auth-toggle-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(20, 184, 166, 0.4);
            }

            .auth-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                padding: 1rem;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
            }

            .auth-modal-overlay.show {
                display: flex;
                opacity: 1;
            }

            .auth-modal-content {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 450px;
                width: 100%;
                height: 100%;
                max-height: 100vh;
                display: flex;
                flex-direction: column;
                position: relative;
                transform: scale(0.9) translateY(-20px);
                opacity: 0;
                transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
            }

            .auth-modal-overlay.show .auth-modal-content {
                transform: scale(1) translateY(0);
                opacity: 1;
            }

            .auth-modal-header {
                flex-shrink: 0;
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
            }

            .auth-modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
        `;
        document.head.appendChild(style);
    }
}

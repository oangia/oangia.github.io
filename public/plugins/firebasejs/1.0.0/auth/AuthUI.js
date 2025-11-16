import { AuthFormHandler } from './AuthFormHandler.js';
import { AuthNavigator } from './AuthNavigator.js';
import { AuthUIManager } from './AuthUIManager.js';
import { AuthEventBinder } from './AuthEventBinder.js';

/**
 * AuthUI - Main orchestrator for authentication UI
 * Only handles two states: loggedIn and loggedOut
 * All other logic is delegated to specialized classes
 */
export class AuthUI {
    constructor(firebase, options) {
        this.firebase = firebase;
        this.options = options;
        
        // Initialize components
        this.formHandler = new AuthFormHandler(this.firebase, this.options);
        this.navigator = new AuthNavigator();
        this.uiManager = new AuthUIManager(this.options);
        this.eventBinder = new AuthEventBinder(this.formHandler, this.navigator);
    }

    /**
     * Handle logged in state
     */
    loggedIn(user) {
        this.uiManager.updateLoggedInUI(user);
        this.eventBinder.attachExternalLogoutButton(this.options.logoutBtnId);
    }

    /**
     * Handle logged out state
     */
    loggedOut() {
        const container = document.getElementById(this.options.containerId);
        
        if (this.uiManager.hasExistingForms(container)) {
            // Use existing forms - attach event listeners only
            this.eventBinder.attachExistingFormListeners(container);
        } else {
            // Generate new forms
            this.uiManager.generateAuthUI(container, this.navigator, this.eventBinder);
        }
    }
}
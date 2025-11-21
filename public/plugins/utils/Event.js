class Event {
    static onClick(elementId, handler) {
      document.addEventListener('click', e => {
        if (e.target.id === elementId) {
          e.preventDefault?.();
          handler(e);
        }
      });
    }
}
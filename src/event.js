function onClick(id, process) {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('click', function (e) {
        e.preventDefault();
        process(e);
    });
}

function onLoad(process) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', process);
    } else {
        process();
    }
}
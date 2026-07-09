const form = {get: (id) => {
  const el = document.getElementById(id);
  if (!el) return null;

  if (el.type === 'checkbox') return el.checked;

  if (el.type === 'radio') {
    const checked = document.querySelector(`input[name="${el.name}"]:checked`);
    return checked ? checked.value : null;
  }

  return 'value' in el ? el.value : null;
}}

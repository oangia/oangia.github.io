const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const majorScaleSteps = [0, 2, 4, 5, 7, 9, 11];
const qualities = ["", "m", "m", "", "", "m", "dim"];

const checkboxContainer = document.getElementById("checkboxContainer");
const tbody = document.querySelector("#chordTable tbody");

// Create checkboxes
notes.forEach((note) => {
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = note;
  checkbox.checked = note.indexOf('#') != 1;
  checkbox.addEventListener("change", updateTable);
  label.appendChild(checkbox);
  label.append(" " + note);
  checkboxContainer.appendChild(label);
});

function formatChord(chord) {
  // Replace '#' with colored span
  chord = chord.replace(/#/g, '<span class="sharp">#</span>');

  // Replace trailing 'm' only if it's not part of 'dim'
  if (chord.endsWith("m") && !chord.endsWith("dim")) {
    chord = chord.slice(0, -1) + '<span class="m">m</span>';
  }

  return chord;
}

function getChordRow(root, rootIndex) {
  const tr = document.createElement("tr");

  const rootCell = document.createElement("td");
  rootCell.textContent = root;
  tr.appendChild(rootCell);

  majorScaleSteps.forEach((step, i) => {
    const noteIndex = (rootIndex + step) % 12;
    const rawChord = notes[noteIndex] + qualities[i];
    const td = document.createElement("td");
    td.innerHTML = formatChord(rawChord);
    tr.appendChild(td);
  });

  return tr;
}

function updateTable() {
  tbody.innerHTML = "";
  const checkedNotes = [...document.querySelectorAll('input[type="checkbox"]:checked')]
    .map(cb => cb.value);
  checkedNotes.forEach(root => {
    const rootIndex = notes.indexOf(root);
    const row = getChordRow(root, rootIndex);
    tbody.appendChild(row);
  });
}

// Initial table load
updateTable();
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`).classList.add('active');
  };
});

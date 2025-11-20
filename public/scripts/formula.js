class ReadabilityEngine {
  EXPECTED_RESULTS = {
    'Consensus Grade Level': 14.89,
    'Automated Readability Index': 15.51,
    'Flesch Reading Ease': 20.00,
    'Gunning Fog Index': 16.20,
    'Flesch-Kincaid Grade Level': 14.07,
    'Coleman-Liau Index': 19.05,
    'SMOG Index': 11.16,
    'Linsear Write': 10.50,
    'FORCAST': 14.64
  };

  calculateARI(data) {
    const chars = data.character.charsWithoutSpaces;
    const words = data.character.totalWords;
    const sentences = data.sentences.total;
    return 4.71 * (chars / words) + 0.5 * (words / sentences) - 21.43;
  }

  calculateFlesch(data) {
    const words = data.character.totalWords;
    const sentences = data.sentences.total;
    const syllables = data.syllables.total;
    return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  }

  calculateGFI(data) {
    const words = data.character.totalWords;
    const sentences = data.sentences.total;
    const compound = data.words.compound;
    const complex = data.words.hard;
    return 0.4 * ((words / (sentences + compound)) + 100 * (complex / words));
  }

  calculateFK(data) {
    const words = data.character.totalWords;
    const sentences = data.sentences.total;
    const syllables = data.syllables.total;
    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  }

  calculateCLI(data) {
    const letters = data.character.lettersAZ;
    const words = data.character.totalWords;
    const sentences = data.sentences.total;
    const L = (letters / words) * 100;
    const S = (sentences / words) * 100;
    return 0.0588 * L - 0.296 * S - 15.8;
  }

  calculateSMOG(data) {
    const sentences = data.sentences.total;
    const complex = data.words.hard;
    return 1.043 * Math.sqrt((complex * (30 / sentences)) + 3.1291);
  }

  calculateLinsearWrite(data) {
    const sentences = data.sentences.total;
    const compound = data.words.compound;
    const easy = data.words.easy;
    const hard = data.words.hard;
    const ignored = 3;
    const initial = ((easy - ignored) * 1 + hard * 3) / (sentences + compound);
    return initial > 20 ? initial / 2 : (initial - 2) / 2;
  }

  calculateFORCAST(data) {
    const words = data.character.totalWords;
    const oneSyl = data.syllables.oneSyl;
    return 20 - ((oneSyl / words) * 150 / 10);
  }

  calculateAll(data) {
    return {
      ARI: this.calculateARI(data),
      Flesch: this.calculateFlesch(data),
      GFI: this.calculateGFI(data),
      FK: this.calculateFK(data),
      CLI: this.calculateCLI(data),
      SMOG: this.calculateSMOG(data),
      Linsear: this.calculateLinsearWrite(data),
      FORCAST: this.calculateFORCAST(data)
    };
  }
}

class ReadabilityLookup {
  constructor() {
    // ------------------------
    // ARI table
    // ------------------------
    this.ARI_TABLE = [
      { min: -Infinity, max: 0.99, grade: "Kindergarten", level: "Extremely Easy", ages: "5–6 yrs" },
      { min: 1, max: 1.99, grade: "1st Grade", level: "Extremely Easy", ages: "6–7 yrs" },
      { min: 2, max: 2.99, grade: "2nd Grade", level: "Very Easy", ages: "7–8 yrs" },
      { min: 3, max: 3.99, grade: "3rd Grade", level: "Very Easy", ages: "8–9 yrs" },
      { min: 4, max: 4.99, grade: "4th Grade", level: "Easy", ages: "9–10 yrs" },
      { min: 5, max: 5.99, grade: "5th Grade", level: "Fairly Easy", ages: "10–11 yrs" },
      { min: 6, max: 6.99, grade: "6th Grade", level: "Fairly Easy", ages: "11–12 yrs" },
      { min: 7, max: 7.99, grade: "7th Grade", level: "Average", ages: "12–13 yrs" },
      { min: 8, max: 8.99, grade: "8th Grade", level: "Average", ages: "13–14 yrs" },
      { min: 9, max: 9.99, grade: "9th Grade", level: "Slightly Difficult", ages: "14–15 yrs" },
      { min: 10, max: 10.99, grade: "10th Grade", level: "Somewhat Difficult", ages: "15–16 yrs" },
      { min: 11, max: 11.99, grade: "11th Grade", level: "Fairly Difficult", ages: "16–17 yrs" },
      { min: 12, max: 12.99, grade: "12th Grade", level: "Difficult", ages: "17–18 yrs" },
      { min: 13, max: Infinity, grade: "College", level: "Very Difficult", ages: "18–22 yrs" }
    ];

    // ------------------------
    // FRE table
    // ------------------------
    this.FRE_TABLE = [
      { min: 140, max: 200, grade: "Kindergarten", level: "Extremely Easy", ages: "5–6 yrs", gradeRange: 0 },
      { min: 130, max: 139, grade: "1st Grade", level: "Very Easy", ages: "6–7 yrs", gradeRange: 1 },
      { min: 120, max: 129, grade: "2nd Grade", level: "Very Easy", ages: "7–8 yrs", gradeRange: 2 },
      { min: 110, max: 119, grade: "3rd Grade", level: "Very Easy", ages: "8–9 yrs", gradeRange: 3 },
      { min: 100, max: 109, grade: "4th Grade", level: "Very Easy", ages: "9–10 yrs", gradeRange: 4 },
      { min: 90,  max: 99,  grade: "5th Grade", level: "Very Easy", ages: "10–11 yrs", gradeRange: 5 },
      { min: 80,  max: 89,  grade: "6th Grade", level: "Easy", ages: "11–12 yrs", gradeRange: 6 },
      { min: 70,  max: 79,  grade: "7th Grade", level: "Fairly Easy", ages: "12–13 yrs", gradeRange: 7 },
      { min: 60,  max: 69,  grade: "8th & 9th Grade", level: "Standard", ages: "13–15 yrs", gradeRange: 8.5 },
      { min: 50,  max: 59,  grade: "10–12th Grade", level: "Fairly Difficult", ages: "15–18 yrs", gradeRange: 11 },
      { min: 30,  max: 49,  grade: "College", level: "Difficult", ages: "18+ yrs", gradeRange: 13.5 },
      { min: 0,   max: 29,  grade: "Professional", level: "Very Difficult", ages: "18+ yrs", gradeRange: 14.5 }
    ];
  }

  interpolate(start, end, t) {
    const s = this.hexToRgb(start);
    const e = this.hexToRgb(end);
  
    const r = Math.round(s.r + (e.r - s.r) * t);
    const g = Math.round(s.g + (e.g - s.g) * t);
    const b = Math.round(s.b + (e.b - s.b) * t);
  
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255
    };
  }

  getColor(gradeRange) {
    let g = Number(gradeRange);
    if (isNaN(g) || g < 0) g = 0;

    if (g < 6) return this.interpolate('#2ECC71', '#1ABC9C', g / 5);
    if (g < 10) return this.interpolate('#F7DC6F', '#F1C40F', (g - 6) / 3);
    if (g < 13) return this.interpolate('#E67E22', '#D35400', (g - 10) / 2);
    return '#C0392B';
  }

  lookupScore(score, table, formulaName) {
    const info = table.find(row => score >= row.min && score <= row.max) || {};
    info.color = this.getColor(info.gradeRange ?? score);

    let formulaHTML;
    switch (formulaName) {
      case 'ARI':
        formulaHTML = `<b>ARI</b> = 4.71×(chars/words) + 0.5×(words/sentences) - 21.43 = ${score}`;
        break;
      case 'FRE':
        formulaHTML = `<b>FRE</b> = 206.835 - 1.015×(words/sentences) - 84.6×(syllables/words) = ${score}`;
        break;
      case 'GFI':
        formulaHTML = `<b>GFI</b> = 0.4 × (words/(sentences+compound) + 100×(complex/words)) = ${score}`;
        break;
      case 'FK':
        formulaHTML = `<b>FK</b> = 0.39×(words/sentences) + 11.8×(syllables/words) - 15.59 = ${score}`;
        break;
      case 'CLI':
        formulaHTML = `<b>CLI</b> = 0.0588×(letters/words×100) - 0.296×(sentences/words×100) - 15.8 = ${score}`;
        break;
      case 'SMOG':
        formulaHTML = `<b>SMOG</b> = 1.043 × √(complex*(30/sentences) + 3.1291) = ${score}`;
        break;
      case 'Linsear':
        formulaHTML = `<b>Linsear</b> = ((easy-3)*1 + hard*3)/(sentences+compound) adjusted = ${score}`;
        break;
      case 'FORCAST':
        formulaHTML = `<b>FORCAST</b> = 20 - ((oneSyl*150)/(words*10)) = ${score}`;
        break;
      default:
        formulaHTML = `${score}`;
    }

    return {
      name: formulaName,
      ...info,
      formulaHTML,
      score
    };
  }

  lookupARI(score) { return this.lookupScore(score, this.ARI_TABLE, 'ARI'); }
  lookupFRE(score) { return this.lookupScore(score, this.FRE_TABLE, 'FRE'); }
  lookupGFI(score) { return this.lookupScore(score, this.ARI_TABLE, 'GFI'); }
  lookupFK(score) { return this.lookupScore(score, this.ARI_TABLE, 'FK'); }
  lookupCLI(score) { return this.lookupScore(score, this.ARI_TABLE, 'CLI'); }
  lookupSMOG(score) { return this.lookupScore(score, this.ARI_TABLE, 'SMOG'); }
  lookupLinsear(score) { return this.lookupScore(score, this.ARI_TABLE, 'Linsear'); }
  lookupFORCAST(score) { return this.lookupScore(score, this.ARI_TABLE, 'FORCAST'); }

  calculateAverage(results) {
    let total = 0;
    results.forEach(item => {
      total += item.gradeRange !== undefined ? Number(item.gradeRange) : Number(item.score);
    });
    const avg = total / results.length;
    return this.lookupScore(avg, this.ARI_TABLE, 'Consensus Grade Level');
  }

  calculate(text, readability) {
    const results = [
      this.lookupARI(readability[0]),
      this.lookupFRE(readability[1]),
      this.lookupGFI(readability[2]),
      this.lookupFK(readability[3]),
      this.lookupCLI(readability[4]),
      this.lookupSMOG(readability[5]),
      this.lookupLinsear(readability[6]),
      this.lookupFORCAST(readability[7])
    ];
    const consensus = this.calculateAverage(results);
    results.unshift(consensus);
    firestore.createWithId('readability', md5(text.trim()), {text, score:results[0].score});
    return results;
  }
}

function showResults(outputId, results) {
  const output = document.getElementById(outputId);
  output.innerHTML = '';
  
  results.forEach(res => {
    /*const expectedScore = expectedResults[res.name];
    let matchHTML = '';
    
    if (expectedScore !== undefined) {
      const comp = compareValue(res.score, expectedScore, 0.01);
      matchHTML = `<div style="color: ${comp.color}; margin-top: 8px;">
        Formula Result: <b>${res.score}</b> ${comp.icon} Expected: <b>${expectedScore.toFixed(2)}</b>
      </div>`;
    }*/
    
    const div = document.createElement('div');
    div.className = 'col-md-12 bg-body-secondary border rounded p-3 mb-3';
    if (res.name === "Consensus Grade Level") {
      div.className += ' formula';
      div.style.borderColor = res.color;
      div.style.borderWidth = '3px';
    } else {
      div.style.borderColor = res.color;
      div.style.borderWidth = '2px';
    }
    div.innerHTML = formatResult(res);
    output.appendChild(div);
  });
}
function formatResult(res, matchHTML='') {
  return `
  <h3 class="fs-6 mb-2 text-center"><b>${res.name}</b></h3>
  <div class="score-box px-3 py-2 rounded mb-2 fs-6">
  <div>Score: <b style="color:${res.color};">${res.score}</b></div>
  <div>Reading Difficulty: <b style="color:${res.color};">${res.level}</b></div>
  <div>Grade Level: <b style="color:${res.color};">${res.grade}</b> | Age Range: <b>${res.ages}</b></div>
  <div>${res.formulaHTML}</div>
  </div>
  ${matchHTML}
  `;
}
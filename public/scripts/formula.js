function interpolate(start, end, t) {
  const s = hexToRgb(start);
  const e = hexToRgb(end);

  const r = Math.round(s.r + (e.r - s.r) * t);
  const g = Math.round(s.g + (e.g - s.g) * t);
  const b = Math.round(s.b + (e.b - s.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255
  };
}

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
  // ------------------------
  // Lookup tables
  // ------------------------
  ARI_TABLE = [
    { min: -Infinity, max: 0.99, grade: "Kindergarten", level: "Extremely Easy", ages: "5–6 yrs"},
    { min: 1, max: 1.99, grade: "1st Grade", level: "Extremely Easy", ages: "6–7 yrs"},
    { min: 2, max: 2.99, grade: "2nd Grade", level: "Very Easy", ages: "7–8 yrs"},
    { min: 3, max: 3.99, grade: "3rd Grade", level: "Very Easy", ages: "8–9 yrs"},
    { min: 4, max: 4.99, grade: "4th Grade", level: "Easy", ages: "9–10 yrs"},
    { min: 5, max: 5.99, grade: "5th Grade", level: "Fairly Easy", ages: "10–11 yrs"},
    { min: 6, max: 6.99, grade: "6th Grade", level: "Fairly Easy", ages: "11–12 yrs"},
    { min: 7, max: 7.99, grade: "7th Grade", level: "Average", ages: "12–13 yrs"},
    { min: 8, max: 8.99, grade: "8th Grade", level: "Average", ages: "13–14 yrs"},
    { min: 9, max: 9.99, grade: "9th Grade", level: "Slightly Difficult", ages: "14–15 yrs"},
    { min: 10, max: 10.99, grade: "10th Grade", level: "Somewhat Difficult", ages: "15–16 yrs"},
    { min: 11, max: 11.99, grade: "11th Grade", level: "Fairly Difficult", ages: "16–17 yrs"},
    { min: 12, max: 12.99, grade: "12th Grade", level: "Difficult", ages: "17–18 yrs"},
    { min: 13, max: Infinity, grade: "College", level: "Very Difficult", ages: "18–22 yrs"}
  ];

  FRE_TABLE = [
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

  // ------------------------
  // Color mapping
  // ------------------------
  getColor(gradeRange) {
    let g = Number(gradeRange);
    if (isNaN(g)) g = 0;
    if (g < 0) g = 0;
  
    if (g < 6) {
      const step = g / 5;
      return interpolate('#2ECC71', '#1ABC9C', step);
    }
  
    if (g < 10) {
      const step = (g - 6) / 3;
      return interpolate('#F7DC6F', '#F1C40F', Math.max(0, step));
    }
  
    if (g < 13) {
      const step = (g - 10) / 2;
      return interpolate('#E67E22', '#D35400', Math.max(0, step));
    }
  
    return '#C0392B';
  }

  // ------------------------
  // Generic lookup helper
  // ------------------------
  lookupScore(score, table) {
    score = parseFloat(score).toFixed(2);
    const info = table.find(row => score >= row.min && score <= row.max) || {};
    info.color = this.getColor(info.gradeRange ?? score);
    info.score = score;
    return info;
  }

  // ------------------------
  // Readability calculators
  // ------------------------
  calculateARI(data) {
    const chars = data.character.charsWithoutSpaces;
    const words = data.character.totalWords;
    const sentences = data.sentences.total;
    const score = 4.71 * (chars / words) + 0.5 * (words / sentences) - 21.43;

    return { 
      name: "Automated Readability Index",
      ...this.lookupScore(score, this.ARI_TABLE),
      formulaHTML: `<b>ARI</b> = 4.71×(${chars}/${words}) + 0.5×(${words}/${sentences}) - 21.43 = ${score.toFixed(2)}`
    };
  }

  calculateFlesch(data) {
    const words = data.character.totalWords;
    const sentences = data.sentences.total;
    const syllables = data.syllables.total;
    const score = Math.ceil(206.835 - 1.015*(words/sentences) - 84.6*(syllables/words));

    return { 
      name: "Flesch Reading Ease",
      ...this.lookupScore(score, this.FRE_TABLE),
      formulaHTML: `<b>FRE</b> = 206.835 - 1.015×(${words}/${sentences}) - 84.6×(${syllables}/${words}) = ${score.toFixed(2)}`
    };
  }

  calculateGFI(data) {
    const words = data.character.totalWords;
    const sentences = data.sentences.total;
    const compound = data.words.compound;
    const complex = data.words.hard;
    const score = 0.4*((words/(sentences+compound)) + 100*(complex/words));

    return { 
      name: "Gunning Fog Index",
      ...this.lookupScore(score.toFixed(1), this.ARI_TABLE),
      formulaHTML: `<b>GFI</b> = 0.4 × (${words}/(${sentences}+${compound}) + 100×(${complex}/${words})) = ${score.toFixed(1)}`
    };
  }

  calculateFK(data) {
    const words = data.character.totalWords;
    const sentences = data.sentences.total;
    const syllables = data.syllables.total;
    const score = 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59;

    return { 
      name: "Flesch-Kincaid Grade Level",
      ...this.lookupScore(score, this.ARI_TABLE),
      formulaHTML: `<b>FK</b> = 0.39×(${words}/${sentences}) + 11.8×(${syllables}/${words}) - 15.59 = ${score.toFixed(2)}`
    };
  }

  calculateCLI(data) {
    const letters = data.character.lettersAZ;
    const words = data.character.totalWords;
    const sentences = data.sentences.total;
    const L = (letters/words)*100;
    const S = (sentences/words)*100;
    const score = 0.0588*L - 0.296*S - 15.8;

    return { 
      name: "Coleman-Liau Index",
      ...this.lookupScore(score, this.ARI_TABLE),
      formulaHTML: `<b>CLI</b> = 0.0588×(${letters}/${words}×100) - 0.296×(${sentences}/${words}×100) - 15.8 = ${score.toFixed(2)}`
    };
  }

  calculateSMOG(data) {
    const sentences = data.sentences.total;
    const complex = data.words.hard;
    const score = 1.043 * Math.sqrt((complex*(30/sentences))+3.1291);

    return { 
      name: "SMOG Index",
      ...this.lookupScore(score, this.ARI_TABLE),
      formulaHTML: `<b>SMOG</b> = 1.043 × √(${complex}*(30/${sentences}) + 3.1291) = ${score.toFixed(2)}`
    };
  }

  calculateLinsearWrite(data) {
    const sentences = data.sentences.total;
    const compound = data.words.compound;
    const easy = data.words.easy;
    const hard = data.words.hard;
    const ignored = 3;

    const initial = ((easy-ignored)*1 + hard*3) / (sentences+compound);
    const adjusted = initial > 20 ? initial/2 : (initial-2)/2;

    return { 
      name: "Linsear Write",
      ...this.lookupScore(adjusted, this.ARI_TABLE),
      formulaHTML: `<b>Linsear</b> initial=(((${easy}-${ignored})×1)+(${hard}×3))/(${sentences}+${compound})=${initial.toFixed(2)}, adjusted=${adjusted.toFixed(2)}`
    };
  }

  calculateFORCAST(data) {
    const words = data.character.totalWords;
    const oneSyl = data.syllables.oneSyl;
    const score = 20 - ((oneSyl/words)*150/10);

    return { 
      name: "FORCAST",
      ...this.lookupScore(score, this.ARI_TABLE),
      formulaHTML: `<b>FORCAST</b> = 20 - ((${oneSyl}*150)/(${words}*10)) = ${score.toFixed(2)}`
    };
  }

  // ------------------------
  // Average grade
  // ------------------------
  calculateAverageGrade(results) {
    let total = 0;
    results.forEach(item => {
      total += item.gradeRange !== undefined ? Number(item.gradeRange) : Number(item.score);
    });

    const avg = total / results.length;

    return {
      name: "Consensus Grade Level",
      ...this.lookupScore(avg, this.ARI_TABLE),
      formulaHTML: `<b>Average</b> = (sum of grade values) / ${results.length} = ${avg.toFixed(2)}`
    };
  }

  calculate(data) {
    const results = [
      this.calculateARI(data),
      this.calculateFlesch(data),
      this.calculateGFI(data),
      this.calculateFK(data),
      this.calculateCLI(data),
      this.calculateSMOG(data),
      this.calculateLinsearWrite(data),
      this.calculateFORCAST(data)
    ];
    const consensus = this.calculateAverageGrade(results);
    results.unshift(consensus);
    return results;
  }
}

class View {
  showResults(outputId, results) {
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
      div.innerHTML = this.formatResult(res);
      output.appendChild(div);
    });
  }
  formatResult(res, matchHTML='') {
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
}
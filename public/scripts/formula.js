const REFERENCE_DATA={difficulty:{hardWords:26,longSentences:0,adverbs:3,hardAdjectives:9,nominals:1,passiveWords:0,weakVerbs:2},character:{totalWords:98,avgWordLength:6,longestWord:"Understanding",longestWordLength:13,charsWithSpaces:720,charsWithoutSpaces:623,lettersAZ:616,alphaNumeric:616},sentences:{total:7,lineCount:0,totalLines:7,avgLength:14,activeVoice:7,passiveVoice:0,short:2,medium:5,long:0},paragraphs:{count:1,shortest:98,longest:98},words:{easy:72,hard:26,compound:0,cardinal:0,properNoun:0,abbreviated:0,unique:75,repeat:15},syllables:{total:201,avgPerWord:2.05,oneSyl:35,twoSyl:37,threeSyl:14,fourSyl:10,fiveSyl:2,sixSyl:0,sevenPlusSyl:0}};
const EXPECTED_RESULTS={"The Average":14.89,"Automated Readability Index":15.51,"Flesch Reading Ease":20,"Gunning Fog Index":16.2,"Flesch-Kincaid Grade Level":14.07,"Coleman-Liau Index":19.05,"SMOG Index":11.16,"Linsear Write":10.5,Forcast:14.64};
class TextAnalyzer{constructor(){this.weakVerbsSet=new Set(["is","are","was","were","be","been","being","am","has","have","had"]),this.adjectiveSuffixes=/(?:able|ible|al|ful|ic|ical|ive|less|ous|ious|eous|ent|ant|ary)$/i,this.nominalizationPatterns=/(?:tion|sion|ment|ness|ity|ance|ence)$/i}normalizeText(e){return e.normalize?e.normalize("NFC"):e}splitSentences(e){return e.split(/[.!?…]+\s+|\n+/g).map((e=>e.trim())).filter((e=>e.length>0))}splitWords(e){return(e=(e=e.normalize("NFC")).replace(/[\u00A0\u200B\t\n\r]+/g," ")).match(/\b[\p{L}\p{N}]+(?:[''\-][\p{L}\p{N}]+)*\b/gu)||[]}countLetters(e){const t=e.match(/[a-zA-Z]/g);return t?t.length:0}countCharsWithSpaces(e){return e.length}countCharsWithoutSpaces(e){return e.replace(/\s/g,"").length}getAverageWordLength(e){return e.length?e.reduce(((e,t)=>e+t.length),0)/e.length:0}getLongestWord(e){if(!e.length)return{word:"",length:0};const t=e.reduce(((e,t)=>t.length>e.length?t:e),"");return{word:t,length:t.length}}toNFDLower(e){try{return e.normalize("NFD").toLowerCase()}catch{return e.toLowerCase()}}syllablesInWord(e){let t=e.toLowerCase().replace(/[^a-z]/g,"");if(["reliable"].includes(t))return 4;if(t.length<=3)return 1;let n=0,s=t;s.match(/le$/)&&n++,s.match(/(ted|ded)$/)&&n++,s.match(/(thm|thms)$/)&&n++,s.match(/(ses|zes|ches|shes|ges|ces)$/)&&n++,s.includes("rial")&&n++,s.includes("creat")&&n++,s=s.replace(/(e|ed|es)$/i,"");n+=(s.match(/aa|ae|ai|ao|au|ay|ea|ee|ei|eo|eu|ey|ia|ie|ii|io|iu|iy|oa|oe|oi|oo|ou|oy|ua|ue|ui|uo|uu|uy|ya|ye|yi|yo|yu|yy/g)||[]).length,s=s.replace(/aa|ae|ai|ao|au|ay|ea|ee|ei|eo|eu|ey|ia|ie|ii|io|iu|iy|oa|oe|oi|oo|ou|oy|ua|ue|ui|uo|uu|uy|ya|ye|yi|yo|yu|yy/g,"");return n+=(s.match(/[aeiouy]/g)||[]).length,n>0?n:1}countAdverbs(e){return e.filter((e=>/ly$/.test(e.toLowerCase())&&e.length>4)).length}countWeakVerbs(e){return e.filter((e=>this.weakVerbsSet.has(e.toLowerCase()))).length}countPassiveVoice(e){const t=e.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi);return t?t.length:0}countHardAdjectives(e){return e.filter((e=>this.syllablesInWord(e)>=3&&this.adjectiveSuffixes.test(e.toLowerCase()))).length}#e(e){return e.filter((e=>this.nominalizationPatterns.test(e.toLowerCase())&&e.length>5)).length}#t(e){const t={};e.forEach((e=>{const n=e.toLowerCase();t[n]=(t[n]||0)+1}));return{unique:e.filter((e=>1===t[e.toLowerCase()])).length,repeat:e.length-new Set(e.map((e=>e.toLowerCase()))).size}}#n(e){return{short:e.filter((e=>this.splitWords(e).length<=10)).length,medium:e.filter((e=>{const t=this.splitWords(e).length;return t>10&&t<21})).length,long:e.filter((e=>this.splitWords(e).length>=21)).length}}analyze(e){const t=this.normalizeText(e),n=this.splitSentences(t),s=this.splitWords(t),r=this.countLetters(t),i=this.countCharsWithSpaces(t),o=this.countCharsWithoutSpaces(t),a=this.getAverageWordLength(s),l=this.getLongestWord(s),h=s.map((e=>this.syllablesInWord(e))),u=h.reduce(((e,t)=>e+t),0),c=this.#n(n),g=e.split(/\n\s*\n/).filter((e=>e.trim().length>0)),d=g.map((e=>this.splitWords(e).length));return{difficulty:{hardWords:h.filter((e=>e>=3)).length,longSentences:c.long,adverbs:this.countAdverbs(s),hardAdjectives:this.countHardAdjectives(s),nominals:this.#e(s),passiveWords:this.countPassiveVoice(t),weakVerbs:this.countWeakVerbs(s)},character:{totalWords:s.length,avgWordLength:Math.round(a),longestWord:l.word,longestWordLength:l.length,charsWithSpaces:i,charsWithoutSpaces:o,lettersAZ:r,alphaNumeric:r},sentences:{total:n.length,lineCount:0,totalLines:n.length,avgLength:n.length?Math.round(s.length/n.length):0,activeVoice:n.length-this.countPassiveVoice(t),passiveVoice:this.countPassiveVoice(t),short:c.short,medium:c.medium,long:c.long},paragraphs:{count:g.length,shortest:d.length?Math.min(...d):0,longest:d.length?Math.max(...d):0},words:{easy:h.filter((e=>e<3)).length,hard:h.filter((e=>e>=3)).length,compound:0,cardinal:0,properNoun:0,abbreviated:0,unique:this.#t(s).unique,repeat:this.#t(s).repeat},syllables:{total:u,avgPerWord:parseFloat((u/s.length).toFixed(2)),oneSyl:h.filter((e=>1===e)).length,twoSyl:h.filter((e=>2===e)).length,threeSyl:h.filter((e=>3===e)).length,fourSyl:h.filter((e=>4===e)).length,fiveSyl:h.filter((e=>5===e)).length,sixSyl:h.filter((e=>6===e)).length,sevenPlusSyl:h.filter((e=>e>=7)).length}}}}

class ReadabilityLookup {
  constructor() {
    this.GRADE_LEVEL = [
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

    this.READING_SCALE = [
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

    if (g < 6) return this.interpolate('#7DCEA0', '#48C9B0', g / 5);   // lighter greens
    if (g < 10) return this.interpolate('#F9E79F', '#F4D03F', (g - 6) / 3); // lighter yellows
    if (g < 13) return this.interpolate('#F5B041', '#EB984E', (g - 10) / 2); // softer oranges
    return '#EC7063'; // lighter red
  }

  lookupScore(score, data, table, formulaName) {
    const info = table.find(row => score >= row.min && score <= row.max) || {};
    info.color = this.getColor(info.gradeRange ?? score);

    let formulaHTML;
    switch (formulaName) {
      case 'Automated Readability Index':
        formulaHTML = `<b>ARI</b> = (4.71 * ( <span class="data">${data.character.charsWithoutSpaces}</span> characters / <span class="data">${data.character.totalWords}</span> words)) + (0.5 * (<span class="data">${data.character.totalWords}</span> words / <span class="data">${data.sentences.total}</span> sentences)) - 21.43 = ${score}`;
        break;
      case 'Flesch Reading Ease':
        formulaHTML = `<b>FRE</b> = 206.835 - (1.015 * (<span class="data">${data.character.totalWords}</span> words / <span class="data">${data.sentences.total}</span> sentences)) - (84.6 * <span class="data">${data.syllables.total}</span> syllables / <span class="data">${data.character.totalWords}</span> words) = ${score}`;
        break;
      case 'Gunning Fog Index':
        formulaHTML = `<b>GFI</b> = (0.4 * (<span class="data">${data.character.totalWords}</span> words / (<span class="data">${data.sentences.total}</span> sentences + <span class="data">0</span> compound sentences)) + 100 * (<span class="data">${data.words.hard}</span> FOG hard words / <span class="data">${data.character.totalWords}</span> words)) = ${score}`;
        break;
      case 'Flesch-Kincaid Grade Level':
        formulaHTML = `<b>FK</b> = (0.39 * (<span class="data">${data.character.totalWords}</span> words / <span class="data">${data.sentences.total}</span> sentences)) + (11.8 * (<span class="data">${data.syllables.total}</span> syllables / <span class="data">${data.character.totalWords}</span> words)) - 15.59 = ${score}`;
        break;
      case 'Coleman-Liau Readability Index':
        formulaHTML = `<b>CLI</b> = (0.0588 * (<span class="data">${data.character.lettersAZ}</span> letters / <span class="data">${data.character.totalWords}</span> words) * 100) - (0.296 * (<span class="data">${data.sentences.total}</span> sentences / <span class="data">${data.character.totalWords}</span> words) * 100) - 15.8 = ${score}`;
        break;
      case 'The SMOG Index':
        formulaHTML = `<b>SMOG</b> = 1.043 * Sqrt((<span class="data">${data.words.hard}</span> hard words * (30 / <span class="data">${data.sentences.total}</span> sentences)) + 3.1291) = ${score}`;
        break;
      case 'Linsear Write Grade Level Formula':
        formulaHTML = `<b>Linsear</b> = (((<span class="data">${data.words.easy}</span> easy words - <span class="data">3</span> ignored words) * 1) + (<span class="data">${data.words.hard}</span> hard words * 3)) / (<span class="data">${data.sentences.total}</span> sentences + <span class="data">0</span> compound sentences) / 2 = ${score}`;
        break;
      case 'FORCAST Readability Formula':
        formulaHTML = `<b>FORCAST</b> = 20 - ((<span class="data">${data.syllables.oneSyl}</span> 1-syllable words * 150) / (<span class="data">${data.character.totalWords}</span> words * 10)) = ${score}`;
        break;
      default:
        formulaHTML = ``;
    }

    return {
      name: formulaName,
      ...info,
      formulaHTML,
      score
    };
  }

  lookupARI(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'Automated Readability Index'); }
  lookupFRE(score, data) { return this.lookupScore(score, data, this.READING_SCALE, 'Flesch Reading Ease'); }
  lookupGFI(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'Gunning Fog Index'); }
  lookupFK(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'Flesch-Kincaid Grade Level'); }
  lookupCLI(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'Coleman-Liau Readability Index'); }
  lookupSMOG(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'The SMOG Index'); }
  lookupLinsear(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'Linsear Write Grade Level Formula'); }
  lookupFORCAST(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'FORCAST Readability Formula'); }

  calculateAverage(results, data) {
    let total = 0;
    results.forEach(item => {
      total += item.gradeRange !== undefined ? Number(item.gradeRange) : Number(item.score);
    });
    const avg = total / results.length;
    return this.lookupScore(avg, data, this.GRADE_LEVEL, 'The Average');
  }

  calculate(text, readability) {
    const data = (new TextAnalyzer()).analyze(text);
    const results = [
      this.lookupARI(readability[0], data),
      this.lookupFRE(Math.ceil(readability[1]), data),
      this.lookupGFI(readability[2], data),
      this.lookupFK(readability[3], data),
      this.lookupCLI(readability[4], data),
      this.lookupSMOG(readability[5], data),
      this.lookupLinsear(readability[6], data),
      this.lookupFORCAST(readability[7], data)
    ];
    const consensus = this.calculateAverage(results, data);
    results.unshift(consensus);
    firestore.createWithId('readability', md5(text.trim()), {text, score:results[0].score});
    return results;
  }
}

function showResults(outputId, results) {
  const output = document.getElementById(outputId);
  output.innerHTML = '';
  
  results.forEach(res => {
    const div = document.createElement('div');
    div.className = 'col-md-12 bg-body-secondary border rounded p-3 mb-3';
    if (res.name === "The Average") {
      div.className += ' formula';
      div.style.setProperty('border-color', res.color, 'important');
      div.style.setProperty('border-width', '3px', 'important');
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
  <div>Score: <b style="color:${res.color};">${res.score.toFixed(2)}</b></div>
  <div>Reading Difficulty: <b style="color:${res.color};">${res.level}</b></div>
  <div>Grade Level: <b style="color:${res.color};">${res.grade}</b></div>
  <div>Age Range: <b>${res.ages}</b></div>
  <div>${res.formulaHTML}</div>
  </div>
  ${matchHTML}
  `;
}
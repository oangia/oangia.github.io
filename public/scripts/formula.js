function calculateARI({letters, wordsCount, sentencesCount}) {
  const score = 4.71*(letters/wordsCount) + 0.5*(wordsCount/sentencesCount) - 21.43;
  const grade = Math.ceil(Math.max(0, score));
  let difficulty, color;
  if(grade<6){ difficulty='Easy'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Medium'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Hard'; color='#e67e22'; }
  else{ difficulty='Very Hard'; color='#e74c3c'; }

  return {
    name: 'Automated Readability Index',
    score, grade, difficulty, color,
    age: grade>0 ? `${5+grade}-${6+grade}` : 'K-5',
    formulaHTML: `<b>ARI</b> = 4.71×(${letters} letters / ${wordsCount} words) + 0.5×(${wordsCount} words / ${sentencesCount} sentences) - 21.43 = ${score.toFixed(2)}`
  };
}

function calculateFlesch({wordsCount, sentencesCount, syllables}) {
  const score = 206.835 - 1.015*(wordsCount/sentencesCount) - 84.6*(syllables/wordsCount);
  let difficulty, color, grade;
  if(score>=90){ difficulty='Very Easy (5th grade)'; color='#2ecc71'; grade='5'; }
  else if(score>=80){ difficulty='Easy (6th grade)'; color='#27ae60'; grade='6'; }
  else if(score>=70){ difficulty='Fairly Easy (7th grade)'; color='#f1c40f'; grade='7'; }
  else if(score>=60){ difficulty='Medium (8-9th grade)'; color='#f39c12'; grade='8-9'; }
  else if(score>=50){ difficulty='Fairly Hard (10-12th grade)'; color='#e67e22'; grade='10-12'; }
  else if(score>=30){ difficulty='Hard (College)'; color='#d35400'; grade='13-16'; }
  else{ difficulty='Very Hard (College graduate)'; color='#e74c3c'; grade='16+'; }

  return {
    name: 'Flesch Reading Ease',
    score, grade, difficulty, color, age: '-',
    formulaHTML: `<b>Flesch</b> = 206.835 - 1.015×(${wordsCount} / ${sentencesCount}) - 84.6×(${syllables} / ${wordsCount}) = ${score.toFixed(2)}`
  };
}

function calculateGFI({wordsCount, sentencesCount, complexWords}) {
  const score = 0.4*((wordsCount/sentencesCount) + 100*(complexWords/wordsCount));
  const grade = Math.round(score);
  let difficulty, color;
  if(grade<6){ difficulty='Easy'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Medium'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Hard'; color='#e67e22'; }
  else{ difficulty='Very Hard'; color='#e74c3c'; }

  return {
    name: 'Gunning Fog Index',
    score, grade, difficulty, color,
    age: grade>0 ? `${5+grade}-${6+grade}` : 'K-5',
    formulaHTML: `<b>GFI</b> = 0.4×((${wordsCount} / ${sentencesCount}) + 100×(${complexWords} / ${wordsCount})) = ${score.toFixed(2)}`
  };
}

function calculateFK({wordsCount, sentencesCount, syllables}) {
  const score = 0.39*(wordsCount/sentencesCount) + 11.8*(syllables/wordsCount) - 15.59;
  const grade = Math.ceil(Math.max(0, score));
  let difficulty, color;
  if(grade<6){ difficulty='Easy'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Medium'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Hard'; color='#e67e22'; }
  else{ difficulty='Very Hard'; color='#e74c3c'; }

  return {
    name: 'Flesch-Kincaid Grade Level',
    score, grade, difficulty, color,
    age: grade>0 ? `${5+grade}-${6+grade}` : 'K-5',
    formulaHTML: `<b>FK</b> = 0.39×(${wordsCount} / ${sentencesCount}) + 11.8×(${syllables} / ${wordsCount}) - 15.59 = ${score.toFixed(2)}`
  };
}

function calculateCLI({letters, wordsCount, sentencesCount}) {
  const L = (letters / wordsCount) * 100;
  const S = (sentencesCount / wordsCount) * 100;
  const score = 0.0588*L - 0.296*S - 15.8;
  const grade = Math.ceil(Math.max(0, score));
  let difficulty, color;
  if(grade<6){ difficulty='Easy'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Medium'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Hard'; color='#e67e22'; }
  else{ difficulty='Very Hard'; color='#e74c3c'; }

  return {
    name: 'Coleman-Liau Index',
    score, grade, difficulty, color,
    age: grade>0 ? `${5+grade}-${6+grade}` : 'K-5',
    formulaHTML: `<b>CLI</b> = 0.0588×L - 0.296×S - 15.8, L=${L.toFixed(2)}, S=${S.toFixed(2)} = ${score.toFixed(2)}`
  };
}

function calculateSMOG({sentencesCount, complexWords}) {
  const score = 1.0430 * Math.sqrt(complexWords * (30 / sentencesCount)) + 3.1291;
  const grade = Math.ceil(Math.max(0, score));
  let difficulty, color;
  if(grade<6){ difficulty='Easy'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Medium'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Hard'; color='#e67e22'; }
  else{ difficulty='Very Hard'; color='#e74c3c'; }

  return {
    name: 'SMOG Index',
    score, grade, difficulty, color,
    age: grade>0 ? `${5+grade}-${6+grade}` : 'K-5',
    formulaHTML: `<b>SMOG</b> = 1.0430×√(${complexWords} × 30 / ${sentencesCount}) + 3.1291 = ${score.toFixed(2)}`
  };
}

function calculateLinsearWrite({sentencesCount, easyWords, hardWords}) {
  const score = ((easyWords*1 + hardWords*3)/sentencesCount);
  const adjusted = score > 20 ? score / 2 : (score - 2) / 2;
  const grade = Math.ceil(Math.max(0, adjusted));
  let difficulty, color;
  if(grade<6){ difficulty='Easy'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Medium'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Hard'; color='#e67e22'; }
  else{ difficulty='Very Hard'; color='#e74c3c'; }

  return {
    name: 'Linsear Write',
    score: adjusted, grade, difficulty, color,
    age: grade>0 ? `${5+grade}-${6+grade}` : 'K-5',
    formulaHTML: `<b>Linsear</b> = ((${easyWords}×1 + ${hardWords}×3)/${sentencesCount}) ${score > 20 ? '÷ 2' : '- 2) ÷ 2'} = ${adjusted.toFixed(2)}`
  };
}

function calculateFORCAST({ wordsCount, oneSyllable }) {
  const score = 20 - ((oneSyllable / wordsCount) * 150 / 10);
  const grade = Math.ceil(Math.max(0, score));
  let difficulty, color;
  if (grade < 6) { difficulty = 'Easy'; color = '#2ecc71'; }
  else if (grade < 9) { difficulty = 'Medium'; color = '#f1c40f'; }
  else if (grade < 12) { difficulty = 'Hard'; color = '#e67e22'; }
  else { difficulty = 'Very Hard'; color = '#e74c3c'; }

  return {
    name: 'FORCAST',
    score, grade, difficulty, color,
    age: grade > 0 ? `${5+grade}-${6+grade}` : 'K-5',
    formulaHTML: `<b>FORCAST</b> = 20 - ((${oneSyllable} / ${wordsCount}) × 150 / 10) = ${score.toFixed(2)}`
  };
}

function calculateAverageGrade(results) {
  const gradesOnly = results.filter(r => typeof r.grade === 'number');
  const avg = gradesOnly.reduce((sum,r)=>sum+r.grade,0)/gradesOnly.length;
  const grade = Math.round(avg);
  let difficulty, color;
  if(grade<6){ difficulty='Easy'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Medium'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Hard'; color='#e67e22'; }
  else{ difficulty='Very Hard'; color='#e74c3c'; }
  
  return {
    name: 'Consensus Grade Level',
    score: avg, grade, difficulty,
    color: '#3498db',
    age: grade > 0 ? `${5+grade}-${6+grade}` : 'K-5',
    formulaHTML: `<b>Average</b> = average grade level = ${avg.toFixed(2)}`
  };
}
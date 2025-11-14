// ARI
function calculateARI({chars, wordsCount, sentencesCount}) {
  const score = 4.71*(chars/wordsCount) + 0.5*(wordsCount/sentencesCount) - 21.43;
  const grade = Math.round(score);
  let difficulty, color;
  if(grade<6){ difficulty='Dễ đọc'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Trung bình'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Khó'; color='#e67e22'; }
  else{ difficulty='Rất khó'; color='#e74c3c'; }

  return {
    name: 'Automated Readability Index',
    score,
    grade,
    difficulty,
    color,
    age: grade>0 ? `${5+grade}-${6+grade}` : '—',
    formulaHTML: `<b>ARI</b> = 4.71*(<b>${chars}</b> ký tự / <b>${wordsCount}</b> từ) + 0.5*(<b>${wordsCount}</b> từ / <b>${sentencesCount}</b> câu) - 21.43 = ${score.toFixed(2)}`
  };
}

// Flesch Reading Ease
function calculateFlesch({wordsCount, sentencesCount, syllables}) {
  const score = Math.ceil(206.835 - 1.015*(wordsCount/sentencesCount) - 84.6*(syllables/wordsCount));
  let difficulty, color;
  if(score>=80){ difficulty='Rất dễ'; color='#2ecc71'; }
  else if(score>=60){ difficulty='Dễ'; color='#f1c40f'; }
  else if(score>=40){ difficulty='Trung bình'; color='#e67e22'; }
  else{ difficulty='Khó'; color='#e74c3c'; }

  return {
    name: 'Flesch Reading Ease',
    score,
    grade: '-', // điểm Flesch không phải grade
    difficulty,
    color,
    age: '-',
    formulaHTML: `<b>Flesch</b> = 206.835 - 1.015*(<b>${wordsCount}</b> từ / <b>${sentencesCount}</b> câu) - 84.6*(<b>${syllables}</b> âm tiết / <b>${wordsCount}</b> từ) = ${score.toFixed(2)}`
  };
}

// Gunning Fog Index
function calculateGFI({wordsCount, sentencesCount, complexWords}) {
  const score = 0.4*((wordsCount/sentencesCount) + 100*(complexWords/wordsCount));
  const grade = Math.round(score);
  let difficulty, color;
  if(grade<6){ difficulty='Dễ đọc'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Trung bình'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Khó'; color='#e67e22'; }
  else{ difficulty='Rất khó'; color='#e74c3c'; }

  return {
    name: 'Gunning Fog Index',
    score,
    grade,
    difficulty,
    color,
    age: grade>0 ? `${5+grade}-${6+grade}` : '—',
    formulaHTML: `<b>GFI</b> = 0.4*((<b>${wordsCount}</b> từ / <b>${sentencesCount}</b> câu) + 100*(<b>${complexWords}</b> từ khó / <b>${wordsCount}</b> từ)) = ${score.toFixed(2)}`
  };
}

// Flesch-Kincaid Grade Level
function calculateFK({wordsCount, sentencesCount, syllables}) {
  const score = 0.39*(wordsCount/sentencesCount) + 11.8*(syllables/wordsCount) - 15.59;
  const grade = Math.round(score);
  let difficulty, color;
  if(grade<6){ difficulty='Dễ đọc'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Trung bình'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Khó'; color='#e67e22'; }
  else{ difficulty='Rất khó'; color='#e74c3c'; }

  return {
    name: 'Flesch-Kincaid Grade Level',
    score,
    grade,
    difficulty,
    color,
    age: grade>0 ? `${5+grade}-${6+grade}` : '—',
    formulaHTML: `<b>FK</b> = 0.39*(<b>${wordsCount}</b> từ / <b>${sentencesCount}</b> câu) + 11.8*(<b>${syllables}</b> âm tiết / <b>${wordsCount}</b> từ) - 15.59 = ${score.toFixed(2)}`
  };
}

// Coleman-Liau Index
function calculateCLI({letters, wordsCount, sentencesCount}) {
  const L = (letters / wordsCount) * 100;
  const S = (sentencesCount / wordsCount) * 100;
  const score = 0.0588*L - 0.296*S - 15.8;
  const grade = Math.round(score);
  let difficulty, color;
  if(grade<6){ difficulty='Dễ đọc'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Trung bình'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Khó'; color='#e67e22'; }
  else{ difficulty='Rất khó'; color='#e74c3c'; }

  return {
    name: 'Coleman-Liau Index',
    score,
    grade,
    difficulty,
    color,
    age: grade>0 ? `${5+grade}-${6+grade}` : '—',
    formulaHTML: `<b>CLI</b> = 0.0588*(<b>${letters}</b> ký tự / <b>${wordsCount}</b> từ *100) - 0.296*(<b>${sentencesCount}</b> câu / <b>${wordsCount}</b> từ *100) - 15.8 = ${score.toFixed(2)}`
  };
}

function calculateSMOG({sentencesCount, complexWords}) {
  const score = 1.043 * (Math.sqrt(complexWords * (30 / sentencesCount)) + 3.1291);
  const grade = Math.round(score);
  let difficulty, color;
  if(grade<6){ difficulty='Dễ đọc'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Trung bình'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Khó'; color='#e67e22'; }
  else{ difficulty='Rất khó'; color='#e74c3c'; }

  return {
    name: 'SMOG Index',
    score,
    grade,
    difficulty,
    color,
    age: grade>0 ? `${5+grade}-${6+grade}` : '—',
    formulaHTML: `<b>SMOG</b> = 1.043*√(<b>${complexWords}</b> từ khó * 30 / <b>${sentencesCount}</b> câu) + 3.1291 = ${score.toFixed(2)}`
  };
}
function calculateLinsearWrite({wordsCount, sentencesCount, easyWords, hardWords}) {
  const score = ((easyWords*1 + hardWords*3)/sentencesCount);
  const grade = Math.round(score);
  let difficulty, color;
  if(grade<6){ difficulty='Dễ đọc'; color='#2ecc71'; }
  else if(grade<9){ difficulty='Trung bình'; color='#f1c40f'; }
  else if(grade<12){ difficulty='Khó'; color='#e67e22'; }
  else{ difficulty='Rất khó'; color='#e74c3c'; }

  return {
    name: 'Linsear Write',
    score,
    grade,
    difficulty,
    color,
    age: grade>0 ? `${5+grade}-${6+grade}` : '—',
    formulaHTML: `<b>Linsear Write</b> = ((<b>${easyWords}</b> từ dễ*1 + <b>${hardWords}</b> từ khó*3)/<b>${sentencesCount}</b> câu) = ${score.toFixed(2)}`
  };
}

function calculateFORCAST({ wordsCount, oneSyllable }) {
  const score = 20 - ((oneSyllable * 150) / (wordsCount * 10));
  const grade = Math.round(score);

  let difficulty, color;
  if (grade < 6) { difficulty = 'Dễ đọc'; color = '#2ecc71'; }
  else if (grade < 9) { difficulty = 'Trung bình'; color = '#f1c40f'; }
  else if (grade < 12) { difficulty = 'Khó'; color = '#e67e22'; }
  else { difficulty = 'Rất khó'; color = '#e74c3c'; }

  return {
    name: 'FORCAST',
    score,
    grade,
    difficulty,
    color,
    age: grade > 0 ? `${5+grade}-${6+grade}` : '—',
    formulaHTML: `<b>FORCAST</b> = 20 - ((<b>${oneSyllable}</b> × 150) / (<b>${wordsCount}</b> × 10)) = ${score.toFixed(2)}`
  };
}

function calculateAverageReading(results) {
  // results: mảng các object trả về từ các công thức trước, có trường grade
  const avg = results.reduce((sum,r)=>sum+r.score,0)/results.length;
  const grade = Math.round(avg);
  return {
    name: 'Average Reading Level Consensus',
    score: avg,
    grade,
    difficulty: '-', 
    color:'#3498db',
    age: '-',
    formulaHTML: `<b>Average Reading Level</b> = trung bình cấp lớp các công thức = ${avg.toFixed(2)}`
  };
}

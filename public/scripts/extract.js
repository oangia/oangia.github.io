function normalizeText(text) {
  return text.normalize ? text.normalize('NFC') : text;
}

function splitSentences(text) {
  return text
    .split(/[.!?…]+\s+|\n+/g)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function splitWords(text) {
  text = text.normalize('NFC');
  text = text.replace(/[\u00A0\u200B\t\n\r]+/g, ' ');
  const matches = text.match(/\b[\p{L}\p{N}]+(?:[''\-][\p{L}\p{N}]+)*\b/gu);
  return matches ? matches : [];
}

function countLetters(text) {
  const matches = text.match(/[a-zA-Z]/g);
  return matches ? matches.length : 0;
}

function countCharsWithSpaces(text) {
  return text.length;
}

function countCharsWithoutSpaces(text) {
  return text.replace(/\s/g, '').length;
}

function getAverageWordLength(words) {
  if (words.length === 0) return 0;
  const totalChars = words.reduce((sum, word) => sum + word.length, 0);
  return totalChars / words.length;
}

function getLongestWord(words) {
  if (words.length === 0) return { word: '', length: 0 };
  const longest = words.reduce((max, word) => word.length > max.length ? word : max, '');
  return { word: longest, length: longest.length };
}

function toNFDLower(s) {
  try { return s.normalize('NFD').toLowerCase(); }
  catch(e){ return s.toLowerCase(); }
}

const baseVowels = /[aăâeêioôơuưyáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/i;

function syllablesInWord(word) {
  const s = toNFDLower(word);
  let count = 0;
  let inV = false;
  
  for(let i = 0; i < s.length; i++){
    const ch = s[i];
    if(baseVowels.test(ch)){
      if(!inV){ 
        count++; 
        inV = true; 
      }
    } else { 
      inV = false; 
    }
  }
  
  if(s.endsWith('e') && count > 1 && !s.match(/[aeiou]e$/)){
    count--;
  }
  
  return Math.max(count, 1);
}

function countAdverbs(words) {
  return words.filter(w => {
    const lower = w.toLowerCase();
    return /ly$/.test(lower) && lower.length > 4;
  }).length;
}

const weakVerbs = new Set(['is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'has', 'have', 'had']);

function countWeakVerbs(words) {
  return words.filter(w => weakVerbs.has(w.toLowerCase())).length;
}

function countPassiveVoice(text) {
  const passivePattern = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
  const matches = text.match(passivePattern);
  return matches ? matches.length : 0;
}

function countLongSentences(sentences) {
  return sentences.filter(s => {
    const sentWords = splitWords(s);
    return sentWords.length >= 20;
  }).length;
}

const adjectiveSuffixes = /(?:able|ible|al|ful|ic|ical|ive|less|ous|ious|eous|ent|ant|ary)$/i;
function countHardAdjectives(words) {
  return words.filter(w => {
    const syls = syllablesInWord(w);
    const lower = w.toLowerCase();
    return syls >= 3 && adjectiveSuffixes.test(lower);
  }).length;
}

const nominalizationPatterns = /(?:tion|sion|ment|ness|ity|ance|ence)$/i;
function countNominalizations(words) {
  return words.filter(w => {
    const lower = w.toLowerCase();
    return nominalizationPatterns.test(lower) && w.length > 5;
  }).length;
}

function countUniqueWords(words) {
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const unique = uniqueWords.size;
  const repeat = words.length - unique;
  return { unique, repeat };
}

function categorizeSentences(sentences) {
  const sCount = 10;
  const mCount = 25;
  const short = sentences.filter(s => splitWords(s).length <= sCount).length;
  const medium = sentences.filter(s => {
    const len = splitWords(s).length;
    return len > sCount && len < mCount;
  }).length;
  const long = sentences.filter(s => splitWords(s).length >= mCount).length;
  return { short, medium, long };
}

function analyzeText(text) {
  const normalized = normalizeText(text);
  const sentences = splitSentences(normalized);
  const words = splitWords(normalized);
  const letters = countLetters(normalized);
  const charsWithSpaces = countCharsWithSpaces(normalized);
  const charsWithoutSpaces = countCharsWithoutSpaces(normalized);
  const avgWordLength = getAverageWordLength(words);
  const longestWord = getLongestWord(words);
  
  const syllablesPerWord = words.map(w => syllablesInWord(w));
  const syllables = syllablesPerWord.reduce((sum, s) => sum + s, 0);
  const oneSyllable = syllablesPerWord.filter(s => s === 1).length;
  const twoSyllable = syllablesPerWord.filter(s => s === 2).length;
  const threeSyllable = syllablesPerWord.filter(s => s === 3).length;
  const fourSyllable = syllablesPerWord.filter(s => s === 4).length;
  const fiveSyllable = syllablesPerWord.filter(s => s === 5).length;
  const sixSyllable = syllablesPerWord.filter(s => s === 6).length;
  const sevenPlusSyllable = syllablesPerWord.filter(s => s >= 7).length;
  
  const hardWords = syllablesPerWord.filter(s => s >= 4).length;
  const easyWords = syllablesPerWord.filter(s => s < 4).length;
  const adverbs = countAdverbs(words);
  const longSentences = countLongSentences(sentences);
  const hardAdjectives = countHardAdjectives(words);
  const nominals = countNominalizations(words);
  const passiveWords = countPassiveVoice(normalized);
  const weakVerbs = countWeakVerbs(words);
  
  const sentenceCategories = categorizeSentences(sentences);
  const avgSentenceLength = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
  const uniqueWordStats = countUniqueWords(words);
  
  // Count paragraphs (split by double newlines or more)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphWordCounts = paragraphs.map(p => splitWords(p).length);
  const shortestParagraph = paragraphWordCounts.length > 0 ? Math.min(...paragraphWordCounts) : 0;
  const longestParagraph = paragraphWordCounts.length > 0 ? Math.max(...paragraphWordCounts) : 0;
  
  return {
    difficulty: {
      hardWords: hardWords,
      longSentences: longSentences,
      adverbs: adverbs,
      hardAdjectives: hardAdjectives,
      nominals: nominals,
      passiveWords: passiveWords,
      weakVerbs: weakVerbs
    },
    character: {
      totalWords: words.length,
      avgWordLength: Math.round(avgWordLength),
      longestWord: longestWord.word,
      longestWordLength: longestWord.length,
      charsWithSpaces: charsWithSpaces,
      charsWithoutSpaces: charsWithoutSpaces,
      lettersAZ: letters,
      alphaNumeric: letters // Assuming same as letters for now
    },
    sentences: {
      total: sentences.length,
      lineCount: 0, // You'll need to implement this based on your needs
      totalLines: sentences.length,
      avgLength: avgSentenceLength,
      activeVoice: sentences.length - passiveWords,
      passiveVoice: passiveWords,
      short: sentenceCategories.short,
      medium: sentenceCategories.medium,
      long: sentenceCategories.long
    },
    paragraphs: {
      count: paragraphs.length,
      shortest: shortestParagraph,
      longest: longestParagraph
    },
    words: {
      easy: easyWords,
      hard: hardWords,
      compound: 0, // You'll need to implement compound word detection
      cardinal: 0, // You'll need to implement number word detection
      properNoun: 0, // You'll need to implement proper noun detection
      abbreviated: 0, // You'll need to implement abbreviation detection
      unique: uniqueWordStats.unique,
      repeat: uniqueWordStats.repeat
    },
    syllables: {
      total: syllables,
      avgPerWord: parseFloat((syllables / words.length).toFixed(2)),
      oneSyl: oneSyllable,
      twoSyl: twoSyllable,
      threeSyl: threeSyllable,
      fourSyl: fourSyllable,
      fiveSyl: fiveSyllable,
      sixSyl: sixSyllable,
      sevenPlusSyl: sevenPlusSyllable
    }
  };
}

// utils
document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('input').value = '';
  document.getElementById('output').classList.add('d-none');
});

function compareValue(calculated, reference, tolerance = 0) {
  const match = Math.abs(calculated - reference) <= tolerance;
  const color = match ? '#4caf50' : '#f44336';
  const icon = match ? '✓' : '✗';
  return { match, color, icon };
}

function formatComparison(label, calculated, reference, unit = '', tolerance = 0) {
  const comp = compareValue(calculated, reference, tolerance);
  return `<div style="color: ${comp.color};">
    <strong>${label}:</strong> <b>${calculated}${unit}</b> 
    ${comp.icon} (Expected: ${reference}${unit})
  </div>`;
}

function showStats(data) {
  document.getElementById('output').classList.remove('d-none');

  document.getElementById('char-stats').innerHTML = `
    <strong class="fs-6">WORD/CHARACTER STATS</strong><br><br>
    ${formatComparison('Total # of words', data.character.totalWords, referenceData.character.totalWords)}
    ${formatComparison('Average word length', data.character.avgWordLength, referenceData.character.avgWordLength, ' characters')}
    <div style="color: ${data.character.longestWord === referenceData.character.longestWord ? '#4caf50' : '#f44336'};">
      <strong>Longest word in text:</strong> <b>${data.character.longestWord}</b> (${data.character.longestWordLength} characters)
      ${data.character.longestWord === referenceData.character.longestWord ? '✓' : '✗'} (Expected: ${referenceData.character.longestWord} (${referenceData.character.longestWordLength} characters))
    </div>
    ${formatComparison('Character Count (including whitespace)', data.character.charsWithSpaces, referenceData.character.charsWithSpaces, ' chars')}
    ${formatComparison('Character Count (excluding whitespace)', data.character.charsWithoutSpaces, referenceData.character.charsWithoutSpaces, ' chars')}
    ${formatComparison('Total # of letter characters (A-Z only)', data.character.lettersAZ, referenceData.character.lettersAZ, ' chars')}
    ${formatComparison('Alpha-Number Character Count', data.character.alphaNumeric, referenceData.character.alphaNumeric, ' chars')}
  `;

  document.getElementById('difficulty').innerHTML = `
    <strong class="fs-6">TEXT DIFFICULTY</strong><br><br>
    ${formatComparison('Hard Words', data.difficulty.hardWords, referenceData.difficulty.hardWords)}
    ${formatComparison('Long Sentences', data.difficulty.longSentences, referenceData.difficulty.longSentences)}
    ${formatComparison('Adverbs', data.difficulty.adverbs, referenceData.difficulty.adverbs)}
    ${formatComparison('Hard Adjectives', data.difficulty.hardAdjectives, referenceData.difficulty.hardAdjectives)}
    ${formatComparison('Nominals', data.difficulty.nominals, referenceData.difficulty.nominals)}
    ${formatComparison('Passive Words', data.difficulty.passiveWords, referenceData.difficulty.passiveWords)}
    ${formatComparison('Weak Verbs', data.difficulty.weakVerbs, referenceData.difficulty.weakVerbs)}
  `;
  
  document.getElementById('sentence-stats').innerHTML = `
    <strong class="fs-6">SENTENCE STATS</strong><br><br>
    ${formatComparison('Total # of sentences', data.sentences.total, referenceData.sentences.total)}
    ${formatComparison('Average Sentence Length', data.sentences.avgLength, referenceData.sentences.avgLength, ' words')}
    ${formatComparison('Number of Active Voice sentences', data.sentences.activeVoice, referenceData.sentences.activeVoice)}
    ${formatComparison('Number of Passive Voice sentences', data.sentences.passiveVoice, referenceData.sentences.passiveVoice)}
    ${formatComparison('Total # of short sentences', data.sentences.short, referenceData.sentences.short)}
    ${formatComparison('Total # of medium sentences', data.sentences.medium, referenceData.sentences.medium)}
    ${formatComparison('Total # of long sentences', data.sentences.long, referenceData.sentences.long)}
  `;
  
  document.getElementById('word-stats').innerHTML = `
    <strong class="fs-6">WORD STATS</strong><br><br>
    ${formatComparison('# of Easy Words', data.words.easy, referenceData.words.easy)}
    ${formatComparison('# of Hard Words', data.words.hard, referenceData.words.hard)}
    ${formatComparison('Total # of unique words', data.words.unique, referenceData.words.unique)}
    ${formatComparison('Total # of repeat words', data.words.repeat, referenceData.words.repeat)}
  `;
  
  document.getElementById('syllable-stats').innerHTML = `
    <strong class="fs-6">SYLLABLE STATS</strong><br><br>
    ${formatComparison('Total # of syllables in text', data.syllables.total, referenceData.syllables.total)}
    ${formatComparison('Average # of syllables per word', data.syllables.avgPerWord, referenceData.syllables.avgPerWord, '', 0.01)}
    ${formatComparison('Total # of words with 1 syllable', data.syllables.oneSyl, referenceData.syllables.oneSyl)}
    ${formatComparison('Total # of words with 2 syllables', data.syllables.twoSyl, referenceData.syllables.twoSyl)}
    ${formatComparison('Total # of words with 3 syllables', data.syllables.threeSyl, referenceData.syllables.threeSyl)}
    ${formatComparison('Total # of words with 4 syllables', data.syllables.fourSyl, referenceData.syllables.fourSyl)}
    ${formatComparison('Total # of words with 5 syllables', data.syllables.fiveSyl, referenceData.syllables.fiveSyl)}
    ${formatComparison('Total # of words with 6 syllables', data.syllables.sixSyl, referenceData.syllables.sixSyl)}
    ${formatComparison('Total # of words with 7+ syllables', data.syllables.sevenPlusSyl, referenceData.syllables.sevenPlusSyl)}
  `;
  
  document.getElementById('paragraph-stats').innerHTML = `
    <strong class="fs-6">PARAGRAPH STATS</strong><br><br>
    ${formatComparison('Number of paragraphs', data.paragraphs.count, referenceData.paragraphs.count)}
    ${formatComparison('Shortest paragraph', data.paragraphs.shortest, referenceData.paragraphs.shortest, ' words')}
    ${formatComparison('Longest paragraph', data.paragraphs.longest, referenceData.paragraphs.longest, ' words')}
  `;
}
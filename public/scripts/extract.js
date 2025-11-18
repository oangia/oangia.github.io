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
  const short = sentences.filter(s => splitWords(s).length <= 10).length;
  const medium = sentences.filter(s => {
    const len = splitWords(s).length;
    return len > 10 && len < 20;
  }).length;
  const long = sentences.filter(s => splitWords(s).length >= 20).length;
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
  
  const hardWords = syllablesPerWord.filter(s => s >= 3).length;
  const easyWords = syllablesPerWord.filter(s => s < 3).length;
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

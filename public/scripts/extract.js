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
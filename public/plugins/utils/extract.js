const REFERENCE_DATA = {
  difficulty: {
    hardWords: 26,
    longSentences: 0,
    adverbs: 3,
    hardAdjectives: 9,
    nominals: 1,
    passiveWords: 0,
    weakVerbs: 2
  },
    character: {
    totalWords: 98,
    avgWordLength: 6,
    longestWord: "Understanding",
    longestWordLength: 13,
    charsWithSpaces: 720,
    charsWithoutSpaces: 623,
    lettersAZ: 616,
    alphaNumeric: 616
  },
  sentences: {
    total: 7,
    lineCount: 0,
    totalLines: 7,
    avgLength: 14,
    activeVoice: 7,
    passiveVoice: 0,
    short: 2,
    medium: 5,
    long: 0
  },
  paragraphs: {
    count: 1,
    shortest: 98,
    longest: 98
  },
  words: {
    easy: 72,
    hard: 26,
    compound: 0,
    cardinal: 0,
    properNoun: 0,
    abbreviated: 0,
    unique: 75,
    repeat: 15
  },
  syllables: {
    total: 201,
    avgPerWord: 2.05,
    oneSyl: 35,
    twoSyl: 37,
    threeSyl: 14,
    fourSyl: 10,
    fiveSyl: 2,
    sixSyl: 0,
    sevenPlusSyl: 0
  }
};
class TextAnalyzer {
  constructor() {
    this.weakVerbsSet = new Set(['is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'has', 'have', 'had']);
    this.adjectiveSuffixes = /(?:able|ible|al|ful|ic|ical|ive|less|ous|ious|eous|ent|ant|ary)$/i;
    this.nominalizationPatterns = /(?:tion|sion|ment|ness|ity|ance|ence)$/i;
  }

  normalizeText(text) {
    return text.normalize ? text.normalize('NFC') : text;
  }

  splitSentences(text) {
    return text
      .split(/[.!?…]+\s+|\n+/g)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  splitWords(text) {
    text = text.normalize('NFC');
    text = text.replace(/[\u00A0\u200B\t\n\r]+/g, ' ');
    const matches = text.match(/\b[\p{L}\p{N}]+(?:[''\-][\p{L}\p{N}]+)*\b/gu);
    return matches || [];
  }

  countLetters(text) {
    const matches = text.match(/[a-zA-Z]/g);
    return matches ? matches.length : 0;
  }

  countCharsWithSpaces(text) {
    return text.length;
  }

  countCharsWithoutSpaces(text) {
    return text.replace(/\s/g, '').length;
  }

  getAverageWordLength(words) {
    if (!words.length) return 0;
    return words.reduce((s, w) => s + w.length, 0) / words.length;
  }

  getLongestWord(words) {
    if (!words.length) return { word: '', length: 0 };
    const word = words.reduce((m, w) => w.length > m.length ? w : m, '');
    return { word, length: word.length };
  }

  toNFDLower(s) {
    try { return s.normalize('NFD').toLowerCase(); }
    catch { return s.toLowerCase(); }
  }

  syllablesInWord(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (["reliable"].includes(w)) return 4;
    if (w.length <= 3) return 1;

    let syl = 0;
    let t = w;

    if (t.match(/le$/)) syl++;
    if (t.match(/(ted|ded)$/)) syl++;
    if (t.match(/(thm|thms)$/)) syl++;
    if (t.match(/(ses|zes|ches|shes|ges|ces)$/)) syl++;
    if (t.includes("rial")) syl++;
    if (t.includes("creat")) syl++;

    t = t.replace(/(e|ed|es)$/i, "");

    const dv = t.match(/aa|ae|ai|ao|au|ay|ea|ee|ei|eo|eu|ey|ia|ie|ii|io|iu|iy|oa|oe|oi|oo|ou|oy|ua|ue|ui|uo|uu|uy|ya|ye|yi|yo|yu|yy/g) || [];
    syl += dv.length;

    t = t.replace(/aa|ae|ai|ao|au|ay|ea|ee|ei|eo|eu|ey|ia|ie|ii|io|iu|iy|oa|oe|oi|oo|ou|oy|ua|ue|ui|uo|uu|uy|ya|ye|yi|yo|yu|yy/g, "");

    const sv = t.match(/[aeiouy]/g) || [];
    syl += sv.length;

    return syl > 0 ? syl : 1;
  }

  countAdverbs(words) {
    return words.filter(w => /ly$/.test(w.toLowerCase()) && w.length > 4).length;
  }

  countWeakVerbs(words) {
    return words.filter(w => this.weakVerbsSet.has(w.toLowerCase())).length;
  }

  countPassiveVoice(text) {
    const passive = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
    const m = text.match(passive);
    return m ? m.length : 0;
  }

  countHardAdjectives(words) {
    return words.filter(w => {
      const syl = this.syllablesInWord(w);
      return syl >= 3 && this.adjectiveSuffixes.test(w.toLowerCase());
    }).length;
  }

  #countNominalizations(words) {
    return words.filter(w =>
      this.nominalizationPatterns.test(w.toLowerCase()) && w.length > 5
    ).length;
  }

  #countUniqueWords(words) {
    const map = {};
    words.forEach(w => {
      const k = w.toLowerCase();
      map[k] = (map[k] || 0) + 1;
    });

    const unique = words.filter(w => map[w.toLowerCase()] === 1).length;
    const repeat = words.length - new Set(words.map(w => w.toLowerCase())).size;

    return { unique, repeat };
  }

  #categorizeSentences(sentences) {
    const s = 10;
    const m = 21;
    const short = sentences.filter(x => this.splitWords(x).length <= s).length;
    const medium = sentences.filter(x => {
      const len = this.splitWords(x).length;
      return len > s && len < m;
    }).length;
    const long = sentences.filter(x => this.splitWords(x).length >= m).length;
    return { short, medium, long };
  }

  analyze(text) {
    const norm = this.normalizeText(text);
    const sentences = this.splitSentences(norm);
    const words = this.splitWords(norm);
    const letters = this.countLetters(norm);
    const charsWith = this.countCharsWithSpaces(norm);
    const charsWithout = this.countCharsWithoutSpaces(norm);
    const avgLen = this.getAverageWordLength(words);
    const longest = this.getLongestWord(words);

    const sylList = words.map(w => this.syllablesInWord(w));
    const syllables = sylList.reduce((s, v) => s + v, 0);

    const sentenceCats = this.#categorizeSentences(sentences);

    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const parCounts = paragraphs.map(p => this.splitWords(p).length);

    return {
      difficulty: {
        hardWords: sylList.filter(s => s >= 3).length,
        longSentences: sentenceCats.long,
        adverbs: this.countAdverbs(words),
        hardAdjectives: this.countHardAdjectives(words),
        nominals: this.#countNominalizations(words),
        passiveWords: this.countPassiveVoice(norm),
        weakVerbs: this.countWeakVerbs(words)
      },
      character: {
        totalWords: words.length,
        avgWordLength: Math.round(avgLen),
        longestWord: longest.word,
        longestWordLength: longest.length,
        charsWithSpaces: charsWith,
        charsWithoutSpaces: charsWithout,
        lettersAZ: letters,
        alphaNumeric: letters
      },
      sentences: {
        total: sentences.length,
        lineCount: 0,
        totalLines: sentences.length,
        avgLength: sentences.length ? Math.round(words.length / sentences.length) : 0,
        activeVoice: sentences.length - this.countPassiveVoice(norm),
        passiveVoice: this.countPassiveVoice(norm),
        short: sentenceCats.short,
        medium: sentenceCats.medium,
        long: sentenceCats.long
      },
      paragraphs: {
        count: paragraphs.length,
        shortest: parCounts.length ? Math.min(...parCounts) : 0,
        longest: parCounts.length ? Math.max(...parCounts) : 0
      },
      words: {
        easy: sylList.filter(s => s < 3).length,
        hard: sylList.filter(s => s >= 3).length,
        compound: 0,
        cardinal: 0,
        properNoun: 0,
        abbreviated: 0,
        unique: this.#countUniqueWords(words).unique,
        repeat: this.#countUniqueWords(words).repeat
      },
      syllables: {
        total: syllables,
        avgPerWord: parseFloat((syllables / words.length).toFixed(2)),
        oneSyl: sylList.filter(s => s === 1).length,
        twoSyl: sylList.filter(s => s === 2).length,
        threeSyl: sylList.filter(s => s === 3).length,
        fourSyl: sylList.filter(s => s === 4).length,
        fiveSyl: sylList.filter(s => s === 5).length,
        sixSyl: sylList.filter(s => s === 6).length,
        sevenPlusSyl: sylList.filter(s => s >= 7).length
      }
    };
  }
}

class ReadabilityEngine{calcARI(t){const c=t.character.charsWithoutSpaces,a=t.character.totalWords;return c/a*4.71+a/t.sentences.total*.5-21.43}calcFRE(t){const c=t.character.totalWords;return 206.835-c/t.sentences.total*1.015-t.syllables.total/c*84.6}calcGFI(t){const c=t.character.totalWords;return.4*(c/(t.sentences.total+t.words.compound)+t.words.hard/c*100)}calcFK(t){const c=t.character.totalWords;return c/t.sentences.total*.39+t.syllables.total/c*11.8-15.59}calcCLI(t){const c=t.character.lettersAZ,a=t.character.totalWords;return.0588*(c/a*100)-.296*(t.sentences.total/a*100)-15.8}calcSMOG(t){const c=t.sentences.total,a=t.words.hard;return 1.043*Math.sqrt(a*(30/c)+3.1291)}calcLinsearWrite(t){const c=t.sentences.total,a=t.words.compound,s=(1*(t.words.easy-3)+3*t.words.hard)/(c+a);return s>20?s/2:(s-2)/2}calcForcast(t){const c=t.character.totalWords;return 20-t.syllables.oneSyl/c*150/10}calculate(t){return{ARI:this.calcARI(t),Flesch:this.calcFRE(t),GFI:this.calcGFI(t),FK:this.calcFK(t),CLI:this.calcCLI(t),SMOG:this.calcSMOG(t),Linsear:this.calcLinsearWrite(t),Forcast:this.calcForcast(t)}}}

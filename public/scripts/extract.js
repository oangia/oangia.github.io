function normalizeText(text) {
  return text.normalize ? text.normalize('NFC') : text;
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?…])\s+|\n+/g)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function splitWords(text) {
  // normalize toàn bộ về NFC
  text = text.normalize('NFC');

  // Thay tất cả non-breaking space, tab, newline thành khoảng trắng chuẩn
  text = text.replace(/[\u00A0\u200B\t\n\r]+/g, ' ');

  // Bắt tất cả từ: chữ, số, dấu '-' hoặc apostrophe nối liền
  const matches = text.match(/\b[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*\b/gu);

  return matches ? matches : [];
}

function countChars(text) {
  return text.replace(/\s/g,'').length; // tất cả ký tự trừ khoảng trắng
}

// Chuẩn hóa chữ thường + NFD để tách dấu
function toNFDLower(s) {
  try { return s.normalize('NFD').toLowerCase(); }
  catch(e){ return s.toLowerCase(); }
}

// Đếm số âm tiết trong từ tiếng Việt hoặc tiếng Anh
const baseVowels = /[aăâeêioôơuưy]/;

function syllablesInWord(word) {
  const s = toNFDLower(word); // tách dấu
  let count = 0;
  let inV = false;
  for(let ch of s){
    if(baseVowels.test(ch)){
      if(!inV){ count++; inV=true; }
    } else { inV=false; }
  }
  return Math.max(count, 1);
}


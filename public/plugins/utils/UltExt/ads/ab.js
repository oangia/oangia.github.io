//const script = document.createElement("script");
//script.src = "https://oangia.github.io/UltExt/ads/ab.js";
//document.documentElement.appendChild(script);

const knownAdSelectors = [
  '.adsbygoogle', 
  '.ad-banner', 
  '#ad-container',
  '.catfish-bottom',
  '.popup',
  '.ad-content',
  '.overlay',
  '.modal',
  '.sponsor',
  '.banner-ad',
];

knownAdSelectors.forEach(selector => {
  document.querySelectorAll(selector).forEach(el => el.remove());
});

const intervalId = setInterval(() => {
  // Code to run every interval
  document.querySelectorAll('*').forEach(el => {
 
      const style = window.getComputedStyle(el);
      if (style.position === "fixed") {
        //el.remove();
      }
      const classNames = Array.from(el.classList).join(' ').toLowerCase();
      if (
        /(^|\s)(ad-|-ad|popup|overlay|sponsor|modal|banner)(-|$)/.test(classNames)
      ) {
        el.remove();
      }
    });
}, 2000);
// Remove elements with suspicious class names



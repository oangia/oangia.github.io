function getBrightness(rgb) {
    const [r, g, b] = rgb;
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function parseRGB(color) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    return null;
}

function invertRGB(rgb, margin = 0) {
    return rgb.map(c => 255 - c - margin);
}

function rgbToCSS(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

document.querySelectorAll("*").forEach(el => {
    checkBackground(el);
    const style = getComputedStyle(el);
    const hasText = el.childNodes.length > 0 && Array.from(el.childNodes).some(node =>
        node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
    );

    if (! hasText) {
      return;
    }
    const color = style.color;
    const rgb = parseRGB(color);
    if (!rgb) return;

    const brightness = getBrightness(rgb);
    console.log(el.className, el.tagName, brightness, color);
    // Example: target mid-bright colors
    if (brightness < 150) {
      const inverted = invertRGB(rgb, -10);
      console.log(el.className, rgbToCSS(inverted));
      el.style.color = rgbToCSS(inverted);
    }
});
document.body.style.display = "block";
function checkBackground(el) {
    const style = getComputedStyle(el);
    const bg = style.backgroundColor;
    const rgb = parseRGB(bg);
    if (!rgb) return;

    const brightness = getBrightness(rgb);
    // Example: target mid-bright colors
    if (brightness > 180) {
      const inverted = invertRGB(rgb, 0);
      el.style.backgroundColor = rgbToCSS(inverted);
    }
}

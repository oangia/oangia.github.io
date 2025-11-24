import fs from "fs";
import path from "path";

const srcDir = "./src";
const outDir = "./build/dist";
const templateDir = path.join(srcDir, "template");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Parse all sections dynamically
function parseSections(fileContent) {
  const sections = {};
  const sectionRegex = /@section\(['"](.+?)['"],\s*['"]([\s\S]*?)['"]\)|@section\(['"](.+?)['"]\)([\s\S]*?)@endsection/g;

  let match;
  while ((match = sectionRegex.exec(fileContent)) !== null) {
    if (match[1] && match[2]) sections[match[1]] = match[2].trim();        // inline section
    else if (match[3] && match[4]) sections[match[3]] = match[4].trim();    // block section
  }

  return sections;
}

function buildPage(filePath, relativePath) {
  const raw = fs.readFileSync(filePath, "utf-8");

  // get template
  const extendMatch = raw.match(/@extends\(['"](.*?)['"]\)/);
  const templateFile = extendMatch ? extendMatch[1] : "main.html";
  const template = fs.readFileSync(path.join(templateDir, templateFile), "utf-8");

  const sections = parseSections(raw);

  // replace all placeholders
  let html = template;
  Object.keys(sections).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, sections[key]);
  });

  // remove unreplaced placeholders
  html = html.replace(/{{.+?}}/g, "");

  const outPath = path.join(outDir, relativePath);
  const outFolder = path.dirname(outPath);
  if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder, { recursive: true });

  fs.writeFileSync(outPath, html);
  console.log(`Built ${relativePath}`);
}

// Recursively build all pages
function buildAll(dir, relative = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(dir, entry.name);
    const relPath = path.join(relative, entry.name);
    if (entry.isDirectory()) buildAll(srcPath, relPath);
    else if (entry.isFile() && entry.name.endsWith(".html") && !srcPath.includes("template")) {
      buildPage(srcPath, relPath);
    }
  }
}

// Copy scripts/styles
function copyFolder(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  fs.readdirSync(src, { withFileTypes: true }).forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyFolder(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  });
}

buildAll(srcDir);
copyFolder(path.join(srcDir, "assets"), path.join(outDir, "assets"));

console.log("Build complete!");

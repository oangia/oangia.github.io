import fs from "fs";
import path from "path";

const template = fs.readFileSync("./src/template/main.html", "utf-8");

const pages = ["index", "about"];

pages.forEach(page => {
  const content = fs.readFileSync(`./src/${page}.html`, "utf-8");
  const html = template.replace("{{content}}", content);
  fs.writeFileSync(`./build/dist/${page}.html`, html);
});

function copyFolder(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  
    const entries = fs.readdirSync(src, { withFileTypes: true });
  
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
  
      if (entry.isDirectory()) {
        copyFolder(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

copyFolder("./src/scripts", "./build/dist/scripts");
copyFolder("./src/styles", "./build/dist/styles");

console.log("Pages generated!");
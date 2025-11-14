// editor.js
class BlogEditor {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) throw new Error('Container not found');
      this.container.style = "padding:5px";
      this.init();
    }
  
    init() {
      // Toolbar
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar';
      this.container.appendChild(toolbar);
      this.toolbar = toolbar;
  
      // Editor div
      const editor = document.createElement('div');
      editor.id = 'editor';
      editor.contentEditable = true;
      editor.innerHTML = '';
      editor.style.minHeight = '300px';
      editor.style.border = '1px solid #ccc';
      editor.style.padding = '10px';
      editor.style.borderRadius = '4px';
      editor.style.overflowY = 'auto';
      this.container.appendChild(editor);
      this.editor = editor;
  
      // HTML view
      const htmlView = document.createElement('textarea');
      htmlView.id = 'html-view';
      htmlView.style.minHeight = '300px';
      htmlView.style.width = '100%';
      htmlView.style.display = 'none';
      htmlView.style.fontFamily = 'monospace';
      htmlView.style.whiteSpace = 'pre-wrap';
      htmlView.style.border = '1px solid #ccc';
      htmlView.style.borderRadius = '4px';
      htmlView.style.padding = '10px';
      this.container.appendChild(htmlView);
      this.htmlView = htmlView;
  
      // CSS
      const style = document.createElement('style');
      style.innerHTML = `
        .toolbar { margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
        .toolbar button { padding: 5px 8px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .toolbar button:hover { background: #e0e0e0; }
        .toolbar svg { width: 16px; height: 16px; fill: #333; }
        .toolbar .separator { margin: 0 4px; color: #888; user-select: none; }
      `;
      document.head.appendChild(style);
  
      // --- Plugin groups ---
      this.pluginGroups = [
        [BoldPlugin, ItalicPlugin, UnderlinePlugin, TextColorPlugin, BgColorPlugin],
        [AlignLeftPlugin, AlignCenterPlugin, AlignRightPlugin, AlignJustifyPlugin],
        [UnorderedListPlugin, OrderedListPlugin],
        [LinkPlugin, ImagePlugin],
        [HTMLViewPlugin]
      ];
  
      this.pluginGroups.forEach((group, idx) => {
        group.forEach(Plugin => new Plugin().init(this));
        if (idx < this.pluginGroups.length - 1) {
          const sep = document.createElement('span');
          sep.className = 'separator';
          sep.innerText = '|';
          this.toolbar.appendChild(sep);
        }
      });
    }
  
    format(command, value = null) {
      document.execCommand(command, false, value);
    }
  
    toggleView() {
      if (this.editor.style.display !== 'none') {
        this.htmlView.value = this.editor.innerHTML;
        this.editor.style.display = 'none';
        this.htmlView.style.display = 'block';
      } else {
        this.editor.innerHTML = this.htmlView.value;
        this.htmlView.style.display = 'none';
        this.editor.style.display = 'block';
      }
    }
  
    getContent() {
      return this.editor.style.display !== 'none'
        ? this.editor.innerHTML
        : this.htmlView.value;
    }
  }
  
  // --- Base Plugin ---
  class Plugin {
    init(editorInstance) {}
    createButton(editorInstance, label, onClick) {
      const btn = document.createElement('button');
      btn.type = 'button';        // ← this is crucial
      btn.innerHTML = label;
      btn.addEventListener('click', onClick);
      editorInstance.toolbar.appendChild(btn);
    }
  }
  
  // --- Plugins ---
  class TextColorPlugin extends Plugin {
    init(editor) {
      const input = document.createElement('input');
      input.type = 'color';
      input.title = 'Text Color';
      input.style.width = '28px';
      input.style.height = '28px';
      input.style.padding = '0';
      input.style.border = '1px solid #ccc';
      input.style.borderRadius = '4px';
      input.addEventListener('input', e => {
        editor.format('foreColor', e.target.value);
      });
      editor.toolbar.appendChild(input);
    }
  }
  
  class BgColorPlugin extends Plugin {
    init(editor) {
      const input = document.createElement('input');
      input.type = 'color';
      input.title = 'Background Color';
      input.style.width = '28px';
      input.style.height = '28px';
      input.style.padding = '0';
      input.style.border = '1px solid #ccc';
      input.style.borderRadius = '4px';
      input.addEventListener('input', e => {
        editor.format('hiliteColor', e.target.value);
      });
      editor.toolbar.appendChild(input);
    }
  }
  
  class BoldPlugin extends Plugin { init(editor) { this.createButton(editor, '<b>B</b>', () => editor.format('bold')); } }
  class ItalicPlugin extends Plugin { init(editor) { this.createButton(editor, '<i>I</i>', () => editor.format('italic')); } }
  class UnderlinePlugin extends Plugin { init(editor) { this.createButton(editor, '<u>U</u>', () => editor.format('underline')); } }
  
  class AlignLeftPlugin extends Plugin { init(editor) { this.createButton(editor, `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="2"/><rect x="3" y="10" width="12" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="3" y="20" width="12" height="2"/></svg>`, () => editor.format('justifyLeft')); } }
  class AlignCenterPlugin extends Plugin { init(editor) { this.createButton(editor, `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="2"/><rect x="6" y="10" width="12" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="6" y="20" width="12" height="2"/></svg>`, () => editor.format('justifyCenter')); } }
  class AlignRightPlugin extends Plugin { init(editor) { this.createButton(editor, `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="2"/><rect x="9" y="10" width="12" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="9" y="20" width="12" height="2"/></svg>`, () => editor.format('justifyRight')); } }
  class AlignJustifyPlugin extends Plugin { init(editor) { this.createButton(editor, `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="2"/><rect x="3" y="10" width="18" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="3" y="20" width="18" height="2"/></svg>`, () => editor.format('justifyFull')); } }
  
  class UnorderedListPlugin extends Plugin { init(editor) { this.createButton(editor, '&bull; List', () => editor.format('insertUnorderedList')); } }
  class OrderedListPlugin extends Plugin { init(editor) { this.createButton(editor, '1. List', () => editor.format('insertOrderedList')); } }
  
  class LinkPlugin extends Plugin { init(editor) { this.createButton(editor, 'Link', () => { const url = prompt('Enter link URL'); if(url) editor.format('createLink', url); }); } }
  class ImagePlugin extends Plugin { init(editor) { this.createButton(editor, 'Image', () => { const url = prompt('Enter image URL'); if(url) editor.format('insertImage', url); }); } }
  
  class HTMLViewPlugin extends Plugin { init(editor) { this.createButton(editor, 'HTML View', () => editor.toggleView()); } }
  
import { DailyTaskTracker } from "./tracker.js";
import { PdfExtractorWidget } from './pdf.js';
import { MediaFrameExtractorWidget } from './image.js';
import { PhotoshopWidget } from './pts.js';
import { GithubWidget } from "./git.js";
import { FileManagerWidget } from "./file.js";

new MediaFrameExtractorWidget();
new PhotoshopWidget();
new PdfExtractorWidget();
new FileManagerWidget();
new GithubWidget();
new DailyTaskTracker({
  Music: ['Learn/write songs', 'Practice singing', 'Exercises'],
  Weekly: [{ name: 'Reading', type: 'weekly' }, { name: 'Learn an expression', type: 'weekly' }]
});

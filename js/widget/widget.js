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
  Music: ['Learn/write songs', 'Practice singing'],
  Basic: ['Exercises', 'Learn an expression', { name: 'Reading', type: 'weekly' }],
  Diet: ['OMAD', 'Drink water 2l']
});

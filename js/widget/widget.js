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
  Music: [
    { name: 'Write/sing songs', type: 'daily', desc: "Enjoy life"},
    { name: 'Learn songs', type: 'daily'},
    { name: 'Practice singing', type: 'daily'},
    { name: 'Reading', type: 'daily', desc: "Try to understand how girls, social, the world work" },
    { name: 'Exercises', type: 'daily' }
  ]
});

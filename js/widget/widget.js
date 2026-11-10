import { DailyTaskTracker } from "./tracker.js";

new DailyTaskTracker({
  Music: [
    { name: 'Write/sing songs', type: 'daily', desc: "Enjoy life"},
    { name: 'Practice singing', type: 'daily'},
    { name: 'Learn songs', type: 'daily'},
    { name: 'Exercises', type: 'daily' }
  ],
  Later: [
    { name: 'Reading', type: 'daily', desc: "Try to understand how girls, social, the world work", disabled: true }
  ]
});

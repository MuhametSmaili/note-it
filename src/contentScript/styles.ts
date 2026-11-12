import css from '@styles/tailwind.css?inline';

// Injected scripts have no HTML page to load Vite's extracted stylesheets.
// Share one style element across repeated crop/preview injections.
let style = document.getElementById('note-it-content-styles');
if (!style) {
  style = document.createElement('style');
  style.id = 'note-it-content-styles';
  document.head.appendChild(style);
}
style.textContent = css;

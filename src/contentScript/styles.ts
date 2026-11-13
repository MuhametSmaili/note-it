import css from '@styles/tailwind.css?inline';

let style = document.getElementById('note-it-content-styles');
if (!style) {
  style = document.createElement('style');
  style.id = 'note-it-content-styles';
  document.head.appendChild(style);
}
style.textContent = css;

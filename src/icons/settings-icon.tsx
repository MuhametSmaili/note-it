import { SVGProps } from 'react';

const SettingsIcon = ({ active, ...props }: SVGProps<SVGSVGElement> & { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      id="Settings_2"
      d="M15.7723 12.5C15.7723 14.5435 14.1157 16.2 12.0723 16.2C10.0288 16.2 8.37227 14.5435 8.37227 12.5C8.37227 10.4565 10.0288 8.8 12.0723 8.8C14.1157 8.8 15.7723 10.4565 15.7723 12.5Z"
      strokeWidth="1.6"
      stroke={active ? '#219ebc' : '#F6F8F9'}
    />
    <path
      id="Settings_3"
      d="M10.1843 2L9.64181 5.32335C8.63536 5.65087 7.72161 6.18236 6.94987 6.86875L3.81571 5.67686L2 8.82176L4.58114 10.9322C4.47397 11.4375 4.41761 11.9616 4.41761 12.4987C4.41761 13.0358 4.47397 13.5598 4.58113 14.0651L2 16.1755L3.81571 19.3204L6.95436 18.1326C7.72516 18.8171 8.63732 19.3471 9.64181 19.674L10.1843 22.9974H13.8157L14.3582 19.674C15.3646 19.3465 16.2784 18.815 17.0501 18.1286L20.1843 19.3205L22 16.1756L19.4189 14.0652C19.526 13.5598 19.5824 13.0358 19.5824 12.4987C19.5824 11.9616 19.526 11.4376 19.4189 10.9322L22 8.82182L20.1843 5.67691L17.0456 6.86475C16.2748 6.1803 15.3627 5.65023 14.3582 5.32335L13.8157 2H10.1843Z"
      stroke={active ? 'currentcolor' : '#F6F8F9'}
      strokeWidth="1.6"
    />
  </svg>
);

export default SettingsIcon;
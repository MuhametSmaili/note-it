import { SVGProps } from 'react';

const ArrowDown = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="m12 17.414 9.707-9.707-1.414-1.414L12 14.586 3.707 6.293 2.293 7.707 12 17.414Z"
      fill="#023047"
    />
  </svg>
);

export default ArrowDown;

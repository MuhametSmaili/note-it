import { SVGProps } from 'react';

const ArrowUp = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="m12 6.586 9.707 9.707-1.414 1.414L12 9.414l-8.293 8.293-1.414-1.414L12 6.586Z"
      fill="#023047"
    />
  </svg>
);

export default ArrowUp;

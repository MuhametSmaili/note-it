import { SVGProps } from 'react';

const FolderIcon = ({ active, ...props }: SVGProps<SVGSVGElement> & { active: boolean }) => (
  <svg width={24} height={24} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M8.172 6H4v2H2V6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2H10.172l-2-2Z" fill={active ? '#219EBC' : 'white'} />
    <path d="M4 18h16V8h2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8h2v10Z" fill={active ? '#023047' : 'white'} />
  </svg>
);

export default FolderIcon;

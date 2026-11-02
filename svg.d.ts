declare module '*.svg' {
  import type { ComponentType, SVGProps } from 'react';

  const content: ComponentType<SVGProps<SVGSVGElement>>;
  export default content;
}

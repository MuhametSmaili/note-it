import React, { LazyExoticComponent } from 'react';
import { Spinner } from '../Spinner/Spinner';

type TabContentProps = {
  component?: LazyExoticComponent<() => JSX.Element>;
  isActive: boolean;
  children: JSX.Element;
};

const TabContent = (props: TabContentProps) => {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center h-full w-full">
          <Spinner />
        </div>
      }
    >
      {props.isActive && (
        <div className="relative h-full w-full overflow-y-auto scrollbar" style={{ maxHeight: '550px' }}>
          <div className="p-2">{props.children}</div>
        </div>
      )}
    </React.Suspense>
  );
};

export default TabContent;

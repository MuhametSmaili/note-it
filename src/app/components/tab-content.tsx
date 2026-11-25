import type { JSX } from "react";
import React from "react";
import { Spinner } from "@components";

type TabContentProps = {
  isActive: boolean;
  children: JSX.Element;
};

const TabContent = (props: TabContentProps) => {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      }
    >
      {props.isActive && <main className="relative h-full w-full min-w-0 overflow-y-auto p-2">{props.children}</main>}
    </React.Suspense>
  );
};

export default TabContent;

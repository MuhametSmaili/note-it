import React from 'react';

enum Actions {
  TAB_HANDLER = 'TAB_HANDLER',
}
type Dispatch = (action: Action) => void;
type State = { activeTab: number };
type ActiveTabProviderProps = { children: React.ReactNode };
interface Action {
  type: keyof typeof Actions;
  payload: number;
}

const ActiveTabStateContext = React.createContext<{ state: State; dispatch: Dispatch } | undefined>(undefined);

function activeTabProvider(state: State, action: Action) {
  switch (action.type) {
    case 'TAB_HANDLER': {
      return { activeTab: action.payload };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

const ActiveTabProvider = ({ children }: ActiveTabProviderProps) => {
  const [state, dispatch] = React.useReducer(activeTabProvider, { activeTab: 0 });
  const value = { state, dispatch };
  return <ActiveTabStateContext.Provider value={value}>{children}</ActiveTabStateContext.Provider>;
};

function useTab() {
  const context = React.useContext(ActiveTabStateContext);
  if (context === undefined) {
    throw new Error('useTab must be used within the TabProvider');
  }
  return context;
}

export { ActiveTabProvider, useTab };

import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';

interface WebSocketContextType {
  ws: React.MutableRefObject<WebSocket | null>;
  connectionStatus: boolean;
  setConnectionStatus: (status: boolean) => void;
  closeWebSocket: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const ws = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false);

  const closeWebSocket = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      setConnectionStatus(false);
    }
  };

  return (
    <WebSocketContext.Provider value={{ ws, connectionStatus, setConnectionStatus, closeWebSocket }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
import { createContext, useContext } from "react";
import { useDisclosure } from "@chakra-ui/react";

export const LogoutModalContext = createContext(undefined);

export const LogoutModalProvider = ({ children }) => {
  const { onClose, onOpen, isOpen } = useDisclosure();

  return <LogoutModalContext.Provider value={{ onClose, onOpen, isOpen }}>{children}</LogoutModalContext.Provider>;
};

export const useLogoutModalContext = () => {
  const context = useContext(LogoutModalContext);
  if (!context) {
    throw new Error("useLogoutModalContext must be used within a LogoutModalProvider");
  }
  return context;
};

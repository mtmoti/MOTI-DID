import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import Redirect from "./redirect";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  Navigate,
} from "react-router-dom";
import { WalletContextProvider } from "./contexts";
import LinksComponent from "./pages/LinksComponent";
import "@rainbow-me/rainbowkit/styles.css";
import CreateLinktree from "./pages/CreateLinktree";
import { ChakraProvider } from "@chakra-ui/react";
import Dashboard from "./pages/Dashboard";
import EditLinktree from "./pages/EditLinktree";
import { Buffer } from "buffer";
import { UserProvider } from "./contexts/userContext";
import { LogoutModalProvider } from "./contexts/logoutModalContext";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";
import { Provider } from "react-redux";
import NotFoundPage from "./pages/NotFound";
window.Buffer = Buffer;
import ReactGA from "react-ga4";

ReactGA.initialize("G-0N39247BHB");

const router = createBrowserRouter([
  {
    path: "/login",
    element: <App />,
  },
  {
    path: "/start",
    element: <App />,
  },
  {
    path: "/",
    element: <Redirect />,
  },
  {
    path: "/:id",
    element: <LinksComponent />,
  },
  {
    path: "create-bio",
    element: <CreateLinktree />,
  },
  {
    path: "dashboard",
    element: <Dashboard />,
  },
  {
    path: "edit-bio/:id",
    element: <EditLinktree />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

ReactDOM.render(
  <React.StrictMode>
    <PersistGate loading={null} persistor={persistor}>
      <Provider store={store}>
        <LogoutModalProvider>
          <UserProvider>
            <WalletContextProvider>
              <ChakraProvider>
                <RouterProvider router={router} />
              </ChakraProvider>
            </WalletContextProvider>
          </UserProvider>
        </LogoutModalProvider>
      </Provider>
    </PersistGate>
  </React.StrictMode>,
  document.getElementById("root")
);

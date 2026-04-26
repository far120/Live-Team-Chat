import { createBrowserRouter } from "react-router-dom";
import SocketConnection from "../SocketConnection/socket.connection";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SocketConnection />,
   
  }
]);
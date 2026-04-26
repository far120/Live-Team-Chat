import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

export default function AppComponent() {
  return <RouterProvider router={router} />;
}
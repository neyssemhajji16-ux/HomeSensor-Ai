import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { Sensors } from "./pages/Sensors";
import { FloorMap } from "./pages/FloorMap";
import { Analytics } from "./pages/Analytics";
import { Alerts } from "./pages/Alerts";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/sensors",
    Component: Sensors,
  },
  {
    path: "/floor-map",
    Component: FloorMap,
  },
  {
    path: "/analytics",
    Component: Analytics,
  },
  {
    path: "/alerts",
    Component: Alerts,
  },
]);

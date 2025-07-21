import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Error boundary
import ErrorBoundary from "./components/ErrorBoundary";

// Layouts (keep these as regular imports since they're used frequently)
import RootLayout from "./layouts/RootLayout";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Lazy load page components
const Home = lazy(() => import("./pages/Home"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const Statistics = lazy(() => import("./pages/Statistics"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Routines = lazy(() => import("./pages/Routines"));
const Users = lazy(() => import("./pages/Users"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Route Error
import RouteError from "./components/RouteError";

// Routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: "register",
            element: <Register />,
          },
          {
            path: "login",
            element: <Login />,
          },
        ],
      },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "statistics",
            element: <Statistics />,
          },
          {
            path: "tasks",
            element: <Tasks />,
          },
          {
            path: "routines",
            element: <Routines />,
          },
          {
            path: "users",
            element: <Users />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const App = () => {
  console.log("App");

  return (
    <ErrorBoundary
      fallbackMessage="Failed to initialize the application. Please refresh the page."
      title="Application Error"
    >
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </ErrorBoundary>
  );
};

export default App;

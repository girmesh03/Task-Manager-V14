import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";

const RootLayout = () => {
  console.log("Root");
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100dvh",
        position: "relative",
        [theme.breakpoints.up("xl")]: {
          width: theme.breakpoints.values.xl,
          margin: "0 auto",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          zIndex: -1,
          inset: 0,
          backgroundImage:
            "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
          ...theme.applyStyles("dark", {
            backgroundImage:
              "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
          }),
        },
      }}
    >
      <Outlet />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme.palette.mode === "dark" ? "dark" : "light"}
        toastStyle={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.875rem",
          borderRadius: "4px",
        }}
      />
    </Box>
  );
};

export default RootLayout;

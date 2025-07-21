import { Outlet } from "react-router-dom";
import { useState, useCallback, Suspense,memo } from "react";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

import MuiAppBar from "./MuiAppBar";
import MuiDrawer from "./MuiDrawer";
import LoadingFallback from "../components/LoadingFallback";

const PublicLayout = () => {
  console.log("Public");
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  return (
    <Box
      width="100%"
      height="100%"
      sx={{ display: "flex", flexDirection: "column" }}
    >
      <MuiAppBar toggleDrawer={toggleDrawer} isDesktop={false}>
        public
      </MuiAppBar>
      <MuiDrawer
        variant="temporary"
        open={drawerOpen}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        isDesktop={isDesktop}
      >
        drawer
      </MuiDrawer>
      <Stack
        component="main"
        direction="column"
        sx={{ px: 1, flexGrow: 1, overflowY: "auto" }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </Stack>
    </Box>
  );
};

export default memo(PublicLayout);

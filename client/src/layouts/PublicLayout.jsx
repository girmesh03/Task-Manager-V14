import {
  Outlet,
  useNavigate,
  Link as RouterLink,
  useLocation,
} from "react-router-dom";
import { useState, useCallback, Suspense, memo } from "react";
import { toast } from "react-toastify";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";

import { useDispatch, useSelector } from "react-redux";
import { useLogoutMutation } from "../redux/features/auth/authApiSlice";
import {
  selectIsAuthenticated,
  setLogout,
} from "../redux/features/auth/authSlice";

import MuiAppBar from "./MuiAppBar";
import MuiDrawer from "./MuiDrawer";
import LoadingFallback from "../components/LoadingFallback";
import MuiThemeDropDown from "../components/MuiThemeDropDown";

const PublicLayout = () => {
  console.log("Public");

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [logout, { isLoading }] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = useLocation().pathname;

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await logout().unwrap();
      console.log("response logout", response);
      dispatch(setLogout());
      toast.success(response.message || "Logout successful!");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error?.data?.message || "Unable to logout");
    }
  };

  return (
    <Box
      width="100%"
      height="100%"
      sx={{ display: "flex", flexDirection: "column" }}
    >
      <MuiAppBar toggleDrawer={toggleDrawer} isDesktop={false}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <MuiThemeDropDown />
          {isAuthenticated ? (
            <Button
              variant="outlined"
              size="small"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              loading={isLoading}
              loadingPosition="center"
              loadingIndicator={<CircularProgress size={20} />}
            >
              logout
            </Button>
          ) : pathname !== "/login" ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<LoginIcon />}
              component={RouterLink}
              to="/login"
            >
              Login
            </Button>
          ) : null}
        </Stack>
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

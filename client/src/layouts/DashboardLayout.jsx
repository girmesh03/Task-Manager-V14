import { useState, useCallback, memo, Suspense } from "react";
import {
  Outlet,
  useLocation,
  Link as RouterLink,
  useNavigate,
} from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "react-toastify";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import LogoutIcon from "@mui/icons-material/Logout";

import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import AssignmentInd from "@mui/icons-material/AssignmentInd";

import { useDispatch } from "react-redux";
import { useLogoutMutation } from "../redux/features/auth/authApiSlice";
import { setLogout } from "../redux/features/auth/authSlice";

import MuiAppBar from "./MuiAppBar";
import MuiDrawer from "./MuiDrawer";
import LoadingFallback from "../components/LoadingFallback";
import MuiThemeDropDown from "../components/MuiThemeDropDown";

const GENERAL_ROUTES = [
  {
    text: "Statistics",
    icon: <DashboardRounded />,
    path: "/statistics",
  },
  { text: "Tasks", icon: <AssignmentRounded />, path: "/tasks" },
  { text: "Routines", icon: <AssignmentInd />, path: "/routines" },
  { text: "Users", icon: <PeopleRounded />, path: "/users" },
];

const MenuListItem = memo(({ item, currentPath }) => {
  const isSelected = currentPath.startsWith(item.path);

  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        component={RouterLink}
        to={item.path}
        selected={isSelected}
        sx={{
          "&.MuiListItemButton-root.Mui-selected": {
            backgroundColor: (theme) => theme.palette.primary.main,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.primary.dark,
            },
          },
        }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.text} />
      </ListItemButton>
    </ListItem>
  );
});

MenuListItem.propTypes = {
  item: PropTypes.shape({
    text: PropTypes.string.isRequired,
    icon: PropTypes.object.isRequired,
    path: PropTypes.string.isRequired,
  }).isRequired,
  currentPath: PropTypes.string.isRequired,
};

const DashboardLayout = () => {
  console.log("Dashboard");

  const [logout, { isLoading }] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const theme = useTheme();
  const { pathname } = useLocation();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [drawerOpen, setDrawerOpen] = useState(isDesktop);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await logout().unwrap();
      dispatch(setLogout());
      toast.success(response.message || "Logout successful!");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error?.data?.message || "Unable to logout");
    }
  };

  return (
    <Box display="flex" width="100%" height="100%">
      <MuiDrawer
        variant={isDesktop ? "permanent" : "temporary"}
        open={drawerOpen}
        onClose={toggleDrawer}
        isDesktop={isDesktop}
        ModalProps={{ keepMounted: true }}
      >
        <List dense>
          <ListSubheader>Dashboard</ListSubheader>
          {GENERAL_ROUTES.map((item) => (
            <MenuListItem key={item.path} item={item} currentPath={pathname} />
          ))}
        </List>
      </MuiDrawer>

      <Stack direction="column" width="100%" sx={{ flexGrow: 1 }}>
        <MuiAppBar toggleDrawer={toggleDrawer} isDesktop={isDesktop}>
          {isDesktop && (
            <Stack direction="row" alignItems="center" sx={{ flexGrow: 1 }}>
              Dashboard nav
            </Stack>
          )}
          <Stack direction="row" alignItems="center" spacing={1}>
            <MuiThemeDropDown />
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
          </Stack>
        </MuiAppBar>

        <Stack
          component="main"
          direction="column"
          sx={{ px: 1, flexGrow: 1, overflowY: "auto" }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </Stack>
      </Stack>
    </Box>
  );
};

export default memo(DashboardLayout);

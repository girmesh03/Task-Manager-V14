import { useState, useCallback, memo, Suspense } from "react";
import { Outlet, useLocation, Link as RouterLink } from "react-router-dom";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import useMediaQuery from "@mui/material/useMediaQuery";

import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import AssignmentInd from "@mui/icons-material/AssignmentInd";

import MuiAppBar from "./MuiAppBar";
import MuiDrawer from "./MuiDrawer";
import LoadingFallback from "../components/LoadingFallback";

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
  const theme = useTheme();
  const { pathname } = useLocation();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [drawerOpen, setDrawerOpen] = useState(isDesktop);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

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
          dashboard
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

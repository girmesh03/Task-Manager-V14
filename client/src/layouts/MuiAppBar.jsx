import { memo } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import MenuIcon from "@mui/icons-material/Menu";

const MuiAppBar = memo(
  ({ children, isDesktop, toggleDrawer, position = "sticky", sx = {} }) => {
    console.log("AppBar");
    const navigate = useNavigate();

    const handleLogoClick = () => {
      navigate("/");
    };

    return (
      <AppBar
        position={position}
        sx={{
          backgroundImage: "none",
          backgroundColor: "background.paper",
          ...sx,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {!isDesktop && (
            <Stack direction="row" alignItems="center">
              <IconButton
                color="inherit"
                onClick={toggleDrawer}
                sx={{ mr: 1, display: { xs: "inline-flex", md: "none" } }}
                size="small"
              >
                <MenuIcon fontSize="small" />
              </IconButton>

              <Stack
                direction="row"
                alignItems="center"
                sx={{ cursor: "pointer" }}
                onClick={handleLogoClick}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #0d47a1, #1976d2)",
                    display: { xs: "none", md: "flex" },
                    justifyContent: "center",
                    alignItems: "center",
                    mr: 1,
                  }}
                >
                  <DashboardRounded sx={{ fontSize: 16, color: "white" }} />
                </Box>
                <Typography
                  variant="h4"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  Taskmanager
                </Typography>
              </Stack>
            </Stack>
          )}
          {children}
        </Toolbar>
      </AppBar>
    );
  }
);

MuiAppBar.propTypes = {
  children: PropTypes.node.isRequired,
  isDesktop: PropTypes.bool.isRequired,
  toggleDrawer: PropTypes.func.isRequired,
  position: PropTypes.string,
  sx: PropTypes.object,
};

export default MuiAppBar;

import { memo } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import ChevronLeft from "@mui/icons-material/ChevronLeft";

import { DRAWER_WIDTH } from "../utils/constants";

const MuiDrawer = memo(
  ({ children, variant, isDesktop, open, onClose, ...props }) => {
    console.log("Drawer");
    const navigate = useNavigate();

    const handleLogoClick = () => {
      onClose();
      navigate("/");
    };

    return (
      <Drawer
        variant={variant}
        open={open}
        onClose={onClose}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: 1,
            borderColor: "divider",
            backgroundImage: "none",
            backgroundColor: "background.paper",
            position: "relative",
          },
        }}
        {...props}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ mr: 1, cursor: "pointer" }}
            onClick={handleLogoClick}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0d47a1, #1976d2)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <DashboardRounded sx={{ fontSize: 16, color: "white" }} />
            </Box>
            <Typography variant="h5">Taskmanager</Typography>
          </Stack>
          {!isDesktop && (
            <IconButton onClick={onClose} size="small">
              <ChevronLeft fontSize="small" />
            </IconButton>
          )}
        </Toolbar>
        {children}
      </Drawer>
    );
  }
);

MuiDrawer.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["permanent", "temporary", "persistent"]).isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isDesktop: PropTypes.bool.isRequired,
};

export default MuiDrawer;

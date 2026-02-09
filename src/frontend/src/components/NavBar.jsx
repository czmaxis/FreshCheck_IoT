import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import { useTheme } from "@mui/material/styles";
import { Link, useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import DevicesIcon from "@mui/icons-material/Devices";
import { useAuth } from "../context/AuthContext.jsx";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1,
          minHeight: { xs: 64, sm: 70 },
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mr: { xs: 2, md: 4 },
          }}
        >
          <Box
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DevicesIcon
              sx={{ fontSize: { xs: 20, sm: 24 }, color: "white" }}
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "white",
              display: { xs: "none", md: "block" },
              fontSize: { sm: "1.1rem", md: "1.25rem" },
              letterSpacing: 0.5,
            }}
          >
            FreshCheck IoT
          </Typography>
        </Box>

        {/* Navigation Buttons */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            gap: { xs: 0.5, sm: 1 },
            minWidth: 0,
          }}
        >
          <Button
            component={Link}
            to="/dashboard"
            startIcon={!isMobile && <DashboardIcon />}
            color="inherit"
            size={isMobile ? "small" : "medium"}
            sx={{
              minWidth: 0,
              px: { xs: 1.5, sm: 2 },
              py: 1,
              borderRadius: 2,
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              fontWeight: 600,
              textTransform: "none",
              whiteSpace: "nowrap",
              backgroundColor: isActive("/dashboard")
                ? "rgba(255, 255, 255, 0.2)"
                : "transparent",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                transform: "translateY(-2px)",
              },
            }}
          >
            {isMobile ? "Dashboard" : "Dashboard"}
          </Button>
          <Button
            component={Link}
            to="/history"
            startIcon={!isMobile && <HistoryIcon />}
            color="inherit"
            size={isMobile ? "small" : "medium"}
            sx={{
              minWidth: 0,
              px: { xs: 1.5, sm: 2 },
              py: 1,
              borderRadius: 2,
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              fontWeight: 600,
              textTransform: "none",
              whiteSpace: "nowrap",
              backgroundColor: isActive("/history")
                ? "rgba(255, 255, 255, 0.2)"
                : "transparent",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                transform: "translateY(-2px)",
              },
            }}
          >
            {isMobile ? "Historie" : "Historie výstrah"}
          </Button>
        </Box>

        {/* User Menu */}
        <Box sx={{ flexGrow: 0, display: "flex", alignItems: "center" }}>
          <Tooltip title={user ? user.name : "Uživatel"} arrow>
            <IconButton
              onClick={handleOpenUserMenu}
              sx={{
                p: 0.5,
                ml: 1,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.1)",
                },
              }}
            >
              <Avatar
                alt={user ? user.name : "U"}
                src={user?.avatar || ""}
                sx={{
                  width: { xs: 38, sm: 42 },
                  height: { xs: 38, sm: 42 },
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    border: "2px solid rgba(255, 255, 255, 0.6)",
                  },
                }}
              />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            onClick={handleCloseUserMenu}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  overflow: "visible",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  "&:before": {
                    content: '""',
                    display: "block",
                    position: "absolute",
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    zIndex: 0,
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.name || "Uživatel"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                {user?.email || ""}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              component={Link}
              to="/profile"
              sx={{
                py: 1.5,
                px: 2,
                gap: 1.5,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                },
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Profil
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                px: 2,
                gap: 1.5,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(211, 47, 47, 0.08)",
                },
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "error.main" }}
              >
                Odhlásit se
              </Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

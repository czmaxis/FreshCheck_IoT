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
import { useTheme } from "@mui/material/styles";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  return (
    <AppBar position="static">
      <Toolbar disableGutters sx={{ px: { xs: 1, sm: 2 } }}>
        <Typography
          variant="h6"
          sx={{
            textDecoration: "none",
            color: "inherit",
            mr: 2,
            display: { xs: "none", md: "block" },
          }}
        >
          FreshCheck IoT
        </Typography>

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
            color="inherit"
            size={isMobile ? "small" : "medium"}
            sx={{
              minWidth: 0,
              px: { xs: 0.75, sm: 1.5 },
              fontSize: { xs: "0.78rem", sm: "0.875rem" },
              whiteSpace: "nowrap",
            }}
          >
            DASHBOARD
          </Button>
          <Button
            component={Link}
            to="/history"
            color="inherit"
            size={isMobile ? "small" : "medium"}
            sx={{
              minWidth: 0,
              px: { xs: 0.75, sm: 1.5 },
              fontSize: { xs: "0.78rem", sm: "0.875rem" },
              whiteSpace: "nowrap",
            }}
          >
            HISTORIE VÝSTRAH
          </Button>
        </Box>

        <Box sx={{ flexGrow: 0, display: "flex", alignItems: "center" }}>
          <Tooltip title={user ? user.name : "Uzivatel"}>
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 0.5 }}>
              <Avatar
                alt={user ? user.name : "U"}
                src={user?.avatar || ""}
                sx={{ width: { xs: 34, sm: 40 }, height: { xs: 34, sm: 40 } }}
              />
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: "45px" }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            keepMounted
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            <MenuItem
              component={Link}
              to="/profile"
              onClick={handleCloseUserMenu}
            >
              Profil
            </MenuItem>
            <MenuItem onClick={handleLogout}>Odhlasit se</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

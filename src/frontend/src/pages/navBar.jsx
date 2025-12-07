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
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <Toolbar>
        <Typography
          variant="h6"
          //component={Link}
          to="/"
          sx={{ textDecoration: "none", color: "inherit", mr: 2 }}
        >
          FreshCheck IoT
        </Typography>

        <Box sx={{ flexGrow: 1, display: "flex", gap: 1 }}>
          <Button component={Link} to="/dashboard" color="inherit">
            Dashboard
          </Button>
        </Box>

        <Box sx={{ flexGrow: 0 }}>
          <Tooltip title={user ? user.name : "Uživatel"}>
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar alt={user ? user.name : "U"} src={user?.avatar || ""} />
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

            <MenuItem onClick={handleLogout}>Odhlásit se</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

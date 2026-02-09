import React, { useEffect, useState } from "react";
import { useLocation, Routes } from "react-router-dom";
import { Box } from "@mui/material";

export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  const handleTransitionEnd = () => {
    if (transitionStage === "fadeOut") {
      setDisplayLocation(location);
      setTransitionStage("fadeIn");
    }
  };

  return (
    <Box
      sx={{
        opacity: transitionStage === "fadeOut" ? 0.3 : 1,
        transition: "opacity 0.3s ease-in-out",
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Routes) {
          return React.cloneElement(child, { location: displayLocation });
        }
        return child;
      })}
    </Box>
  );
}

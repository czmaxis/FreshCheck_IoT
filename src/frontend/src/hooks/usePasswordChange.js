import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { changePassword } from "../services/authService.js";

export function usePasswordChange() {
  const { token } = useAuth();

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdOld, setPwdOld] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdNewConfirm, setPwdNewConfirm] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const openPasswordDialog = useCallback(() => {
    setPwdOld("");
    setPwdNew("");
    setPwdNewConfirm("");
    setPwdError("");
    setPwdOpen(true);
  }, []);

  const closePasswordDialog = useCallback(() => {
    if (!pwdLoading) setPwdOpen(false);
  }, [pwdLoading]);

  const handleChangePassword = useCallback(async () => {
    if (!pwdOld || !pwdNew || !pwdNewConfirm) {
      setPwdError("Vyplňte všechna pole.");
      return;
    }
    if (pwdNew !== pwdNewConfirm) {
      setPwdError("Nová hesla se neshodují.");
      return;
    }

    try {
      setPwdLoading(true);
      setPwdError("");
      await changePassword({ oldPassword: pwdOld, password: pwdNew }, token);
      setPwdOpen(false);
    } catch (err) {
      console.error("Password change error:", err);
      setPwdError(err.response?.data?.message || "Nepodařilo se změnit heslo.");
    } finally {
      setPwdLoading(false);
    }
  }, [pwdOld, pwdNew, pwdNewConfirm, token]);

  return {
    pwdOpen,
    pwdOld,
    setPwdOld,
    pwdNew,
    setPwdNew,
    pwdNewConfirm,
    setPwdNewConfirm,
    pwdError,
    pwdLoading,
    openPasswordDialog,
    closePasswordDialog,
    handleChangePassword,
  };
}

import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { updateUser } from "../services/authService.js";

export function useProfileEdit() {
  const { user, token, setUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEdit = useCallback(() => {
    setEditing(true);
    setName(user?.name || "");
    setEmail(user?.email || "");
    setError("");
  }, [user]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setName(user?.name || "");
    setEmail(user?.email || "");
    setError("");
  }, [user]);

  const handleSave = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        name: name || user.name,
        email: email || user.email,
      };

      await updateUser(user._id, payload, token);

      setUser({ ...user, ...payload });
      setEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(
        err.response?.data?.message || "Nepodařilo se uložit změny profilu.",
      );
    } finally {
      setLoading(false);
    }
  }, [name, email, user, token, setUser]);

  return {
    user,
    editing,
    name,
    setName,
    email,
    setEmail,
    error,
    loading,
    handleEdit,
    handleCancel,
    handleSave,
  };
}

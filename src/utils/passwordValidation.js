export const passwordRequirementsText =
  "Password must be at least 6 characters and include at least 1 symbol.";

export const isPasswordValid = (password) =>
  password.length >= 6 && /[^A-Za-z0-9]/.test(password);

export const passwordRequirementsText =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.";

export const isPasswordValid = (password) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

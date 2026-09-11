// Username rules shared by the profile form (client) and the server.

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9-]{7,15}$/;

// Route names and brand terms a maker cannot claim as a username.
export const RESERVED_USERNAMES = new Set([
  "admin", "api", "about", "auth", "dashboard", "login", "logout", "signup",
  "submit", "tools", "directory", "makers", "privacy", "terms", "settings", "profile",
  "folio", "foliostuff", "www", "mail", "support", "help",
]);

// registerAs creates a namespaced configuration object
import { registerAs } from "@nestjs/config";

export default registerAs("jwt", () => ({
  // Access token secret – should be a long random string
  secret: process.env.JWT_SECRET,
  // Refresh token secret – different from access secret for security
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  // Access token expiry – short-lived
  expiresIn: "15m",
  // Refresh token expiry – long-lived
  refreshExpiresIn: "7d",
}));

// backend/src/config/email.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("email", () => {
  // Ensure required environment variables exist, with fallbacks for development
  const host = process.env.EMAIL_HOST || "smtp.mailtrap.io";
  const port = parseInt(process.env.EMAIL_PORT || "2525", 10);
  const secure = process.env.EMAIL_SECURE === "true";
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASSWORD || "";
  const from = process.env.EMAIL_FROM || "noreply@yourapp.com";
  const fromName = process.env.EMAIL_FROM_NAME || "Your App Name";

  // If using Gmail, warn about App Password requirement
  if (host.includes("gmail") && user && !pass) {
    console.warn(
      "⚠️  Gmail requires an App Password. Generate one at: https://myaccount.google.com/apppasswords",
    );
  }

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    from,
    fromName,
  };
});

import { signUpUser } from "./auth.service.js";
import { loginUser } from "./auth.service.js";
import { logoutUser } from "./auth.service.js";
import { confirmEmailVerification } from "./auth.service.js";
import { refreshAuthSession, revokeRefreshToken } from "./auth.service.js";

const getCookieValue = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rawValParts] = part.trim().split("=");
    if (!rawKey) continue;
    if (rawKey === name) {
      const rawVal = rawValParts.join("=");
      try {
        return decodeURIComponent(rawVal);
      } catch {
        return rawVal;
      }
    }
  }
  return null;
};

const parseDurationToMs = (value) => {
  if (!value) return undefined;
  if (typeof value === "number") return value;
  const str = String(value).trim();
  const match = str.match(/^(\d+)(ms|s|m|h|d)?$/i);
  if (!match) return undefined;
  const amount = Number(match[1]);
  const unit = (match[2] || "ms").toLowerCase();
  switch (unit) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return undefined;
  }
};

export const signUp = async (req, res) => {
  try {
    const result = await signUpUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = "Duplicate value detected.";

      if (field === "email") message = "This email is already registered.";
      else if (field === "studentStaffId")
        message = "This Student/Staff ID is already registered.";
      else if (field === "companyName")
        message = "A company with this name already exists.";

      return res.status(400).json({ message });
    }

    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);

    const cookieName = process.env.AUTH_COOKIE_NAME || "auth_token";
    const requestedSameSite = (
      process.env.COOKIE_SAMESITE || "lax"
    ).toLowerCase();
    const sameSite =
      requestedSameSite === "none"
        ? "none"
        : requestedSameSite === "strict"
          ? "strict"
          : "lax";

    // If SameSite=None, cookies must be Secure in modern browsers.
    const secure =
      sameSite === "none" ? true : process.env.NODE_ENV === "production";

    const accessCookieMaxAge = parseDurationToMs(
      process.env.ACCESS_TOKEN_EXPIRES_IN || ""
    );

    // Access token cookie (used by middleware when storage is blocked).
    res.cookie(cookieName, result.token, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
      ...(accessCookieMaxAge ? { maxAge: accessCookieMaxAge } : {}),
    });

    // Optional refresh-token cookie (standard access+refresh flow)
    if (result.refreshToken) {
      const refreshCookieName =
        process.env.REFRESH_COOKIE_NAME || "refresh_token";
      const refreshMaxAge = parseDurationToMs(
        process.env.REFRESH_TOKEN_EXPIRES_IN || "30d"
      );

      res.cookie(refreshCookieName, result.refreshToken, {
        httpOnly: true,
        secure,
        sameSite,
        path: "/",
        ...(refreshMaxAge ? { maxAge: refreshMaxAge } : {}),
      });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const result = await logoutUser();

    const cookieName = process.env.AUTH_COOKIE_NAME || "auth_token";
    const requestedSameSite = (
      process.env.COOKIE_SAMESITE || "lax"
    ).toLowerCase();
    const sameSite =
      requestedSameSite === "none"
        ? "none"
        : requestedSameSite === "strict"
          ? "strict"
          : "lax";
    const secure =
      sameSite === "none" ? true : process.env.NODE_ENV === "production";

    res.clearCookie(cookieName, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
    });

    const refreshCookieName =
      process.env.REFRESH_COOKIE_NAME || "refresh_token";
    const refreshToken = getCookieValue(req.headers?.cookie, refreshCookieName);
    await revokeRefreshToken(refreshToken);

    res.clearCookie(refreshCookieName, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const requestedSameSite = (
      process.env.COOKIE_SAMESITE || "lax"
    ).toLowerCase();
    const sameSite =
      requestedSameSite === "none"
        ? "none"
        : requestedSameSite === "strict"
          ? "strict"
          : "lax";
    const secure =
      sameSite === "none" ? true : process.env.NODE_ENV === "production";

    const refreshCookieName =
      process.env.REFRESH_COOKIE_NAME || "refresh_token";
    const refreshToken = getCookieValue(req.headers?.cookie, refreshCookieName);

    const session = await refreshAuthSession(refreshToken);

    const cookieName = process.env.AUTH_COOKIE_NAME || "auth_token";
    const accessCookieMaxAge = parseDurationToMs(
      process.env.ACCESS_TOKEN_EXPIRES_IN || ""
    );

    res.cookie(cookieName, session.token, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
      ...(accessCookieMaxAge ? { maxAge: accessCookieMaxAge } : {}),
    });

    return res.status(200).json({ token: session.token, user: session.user });
  } catch (error) {
    return res.status(401).json({ message: error.message || "Unauthorized" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await confirmEmailVerification(token);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

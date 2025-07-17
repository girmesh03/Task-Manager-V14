// backend/socket.js
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import { Server as SocketIOServer } from "socket.io";
import { joinDepartmentRooms } from "./utils/SocketEmitter.js";
import { setIO } from "./utils/SocketInstance.js";
import CustomError from "./errorHandler/CustomError.js";

const extractToken = (cookieHeader) => {
  if (!cookieHeader) return null;
  const tokenCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("access_token="));
  return tokenCookie ? tokenCookie.split("=")[1].trim() : null;
};

const socketAuth = async (socket, next) => {
  try {
    const token = extractToken(socket.handshake.headers.cookie);
    if (!token) {
      return next(
        new CustomError(
          "Access token is required",
          401,
          "UNAUTHORIZED_TOKEN_ERROR"
        )
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return next(
          new CustomError(
            "Access token has expired",
            401,
            "TOKEN_EXPIRED_ERROR"
          )
        );
      } else if (jwtError.name === "JsonWebTokenError") {
        return next(
          new CustomError("Invalid access token", 401, "INVALID_TOKEN_ERROR")
        );
      } else {
        return next(
          new CustomError(
            "Token verification failed",
            401,
            "TOKEN_VERIFICATION_FAILED_ERROR"
          )
        );
      }
    }

    // Fetch user data with company and department details
    const user = await User.findById(decoded.userId)
      .populate("company", "name subscription.status isActive")
      .populate("department", "name isActive");

    if (!user) {
      return next(
        new CustomError("User not found", 401, "USER_NOT_FOUND_ERROR")
      );
    }

    // Check if user is verified
    if (!user.isVerified) {
      return next(
        new CustomError(
          "User account is not verified",
          401,
          "ACCOUNT_NOT_VERIFIED_ERROR"
        )
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return next(
        new CustomError(
          "User account is deactivated",
          401,
          "USER_DEACTIVATED_ERROR"
        )
      );
    }

    // Check if company is active
    if (!user.company.isActive) {
      res.clearCookie("refresh_token");
      return next(
        new CustomError(
          "Company account is deactivated",
          401,
          "COMPANY_DEACTIVATED_ERROR"
        )
      );
    }

    // Check company subscription status
    if (user.company.subscription.status !== "active") {
      return next(
        new CustomError(
          "Company subscription is not active",
          403,
          "SUBSCRIPTION_INACTIVE_ERROR"
        )
      );
    }

    // Check if department is active
    if (!user.department.isActive) {
      return next(
        new CustomError(
          "Department is deactivated",
          401,
          "DEPARTMENT_DEACTIVATED_ERROR"
        )
      );
    }

    // Attach user data to request
    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return next(
      new CustomError(
        "Internal server error during authentication",
        500,
        "AUTHENTICATION_ERROR"
      )
    );
  }
};

const setupSocketIO = (server, corsSocketOptions) => {
  try {
    const io = new SocketIOServer(server, {
      // path: "/api/socket.io",
      cors: corsSocketOptions,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
      },
    });

    setIO(io);
    io.use(socketAuth);

    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id} | User: ${socket.user._id}`);

      // Non-blocking room join
      setTimeout(() => {
        joinDepartmentRooms(socket.user._id).catch((err) =>
          console.error(`Room join error: ${err.message}`)
        );
      }, 0);

      socket.on("disconnect", (reason) => {
        console.log(`Socket disconnected (${reason}): ${socket.id}`);
      });

      socket.on("error", (err) => {
        console.error(`Socket error: ${socket.id} | ${err.message}`);
      });
    });

    io.engine.on("connection_error", (err) => {
      console.error(`Socket.IO connection error: ${err.message}`);
    });

    return io;
  } catch (err) {
    console.error(`Socket.IO setup failed: ${err.message}`);
    throw err;
  }
};

export default setupSocketIO;

// backend/config/cloudinary.js
import crypto from "crypto";

const getRequiredEnv = (key) => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`${key} environment variable is not defined`);
  }
  return val;
};

export const getCloudinaryConfig = () => {
  return {
    cloudName: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: getRequiredEnv("CLOUDINARY_API_KEY"),
    apiSecret: getRequiredEnv("CLOUDINARY_API_SECRET"),
  };
};

// Cloudinary signature generation per docs:
// 1) Create a string with params sorted by key in ascending order as key=value joined with &
// 2) Append the API secret to the string
// 3) signature = sha1(string)
export const signUploadParams = (params) => {
  const { apiSecret } = getCloudinaryConfig();

  // Remove undefined or null values
  const filtered = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .reduce((acc, k) => ({ ...acc, [k]: params[k] }), {});

  const toSign = Object.keys(filtered)
    .sort()
    .map((key) => `${key}=${Array.isArray(filtered[key]) ? filtered[key].join(",") : filtered[key]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(`${toSign}${apiSecret}`)
    .digest("hex");

  return signature;
};

import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";

import { useLoginMutation } from "../redux/features/auth/authApiSlice";
import { setCredentials } from "../redux/features/auth/authSlice";
import { useDispatch } from "react-redux";

import MuiTextField from "../components/MuiTextField";

const Login = () => {
  console.log("Login");
  const navigate = useNavigate();
  const location = useLocation();

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();

  const { handleSubmit, control, reset } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword((prev) => !prev);

  const onSubmit = async (formData) => {
    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      }).unwrap();

      dispatch(setCredentials({ currentUser: response.data })); // Only set user info
      toast.success(response.message || "Login successful!");
      reset();
      navigate(location.state?.from || "/statistics", { replace: true });
    } catch (error) {
      const errMsg = error?.data?.message || error?.message || "Login failed";
      const errorType = error?.data?.errorCode || error?.errorCode || "UNKNOWN";
      toast.error(errMsg);
      if (errorType === "AUTH_VERIFY") {
        navigate("/verify-email");
      }
    }
  };

  const features = useMemo(
    () => [
      {
        icon: <SettingsSuggestRoundedIcon sx={{ color: "text.secondary" }} />,
        title: "Streamlined Task Management",
        description:
          "Efficiently organize, assign, and monitor tasks to keep your projects on track and deadlines in check.",
      },
      {
        icon: <ConstructionRoundedIcon sx={{ color: "text.secondary" }} />,
        title: "Robust Project Tracking",
        description:
          "Track progress across multiple projects with tools designed for reliability and accuracy.",
      },
      {
        icon: <ThumbUpAltRoundedIcon sx={{ color: "text.secondary" }} />,
        title: "User-Friendly Interface",
        description:
          "Easily navigate through tasks and reports with an intuitive design tailored for productivity.",
      },
    ],
    []
  );

  return (
    <Grid
      container
      direction={{ xs: "column-reverse", md: "row" }}
      spacing={4}
      sx={{ py: 4, px: 1, maxWidth: { xs: 450, md: 900 }, m: "auto" }}
    >
      {/* Features Section - Hidden on mobile, visible on desktop */}
      <Grid size={{ xs: 12, md: 6 }} sx={{ m: "auto" }}>
        <Stack direction="column" spacing={4}>
          {/* <SitemarkIcon /> */}
          {features.map((feature, index) => (
            <Stack key={index} direction="row" spacing={2}>
              {feature.icon}
              <Box>
                <Typography gutterBottom fontWeight="medium">
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Grid>

      {/* Login Form - Full width on mobile, 50% on desktop */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card
          variant="outlined"
          sx={{
            px: { xs: 2, md: 3 },
            py: 8,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Typography
            variant="h4"
            textAlign="center"
            gutterBottom
            fontWeight={700}
          >
            Welcome Back!
          </Typography>

          <CardContent
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            autoComplete="off"
            sx={{ mt: 2 }}
          >
            <MuiTextField
              name="email"
              control={control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              }}
              label="Email"
              placeholder="xyz@example.com"
              autoComplete="email"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <MuiTextField
              name="password"
              control={control}
              rules={{
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              }}
              label="Password"
              placeholder="••••••"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      size="small"
                      sx={{ cursor: isLoading ? "default" : "pointer" }}
                      onClick={togglePassword}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              size="small"
              disabled={isLoading}
              loading={isLoading}
              loadingIndicator={
                <CircularProgress size={20} sx={{ color: "white" }} />
              }
              loadingPosition="start"
              sx={{ mt: 2 }}
            >
              {isLoading ? "Logging In..." : "Login"}
            </Button>
          </CardContent>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            fullWidth
            disabled={isLoading}
            onClick={() => navigate("/forgot-password")}
            sx={{ mt: 2 }}
          >
            Forgot Password
          </Button>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Login;

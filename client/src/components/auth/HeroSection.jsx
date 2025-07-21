import { useNavigate } from "react-router-dom";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const HeroSection = () => {
  console.log("HeroSection");
  const navigate = useNavigate();
  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: { xs: 4, sm: 8 },
        pb: { xs: 8, sm: 12 },
      }}
    >
      <Stack
        spacing={2}
        useFlexGap
        sx={{ alignItems: "center", width: { xs: "100%", sm: "70%" } }}
      >
        <Typography
          variant="h1"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            fontSize: "clamp(3rem, 10vw, 3.5rem)",
          }}
        >
          Master&nbsp;Your&nbsp;
          <Typography
            component="span"
            variant="h1"
            sx={(theme) => ({
              fontSize: "inherit",
              color: "primary.main",
              ...theme.applyStyles("dark", {
                color: "primary.light",
              }),
            })}
          >
            Productivity
          </Typography>
        </Typography>
        <Typography
          sx={{
            textAlign: "center",
            color: "text.secondary",
            width: { sm: "100%", md: "80%" },
          }}
        >
          Streamline tasks, track progress, and collaborate effortlessly with
          our intelligent task manager. Achieve more with intuitive tools
          designed for individuals and teams.
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          sx={{ minWidth: "fit-content" }}
          onClick={() => navigate("/register")}
        >
          Get Started
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: "center" }}
        >
          By clicking "Get Started" you agree to our&nbsp;Terms & Conditions
        </Typography>
      </Stack>
    </Container>
  );
};

export default HeroSection;

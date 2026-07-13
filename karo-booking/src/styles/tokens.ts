export const tokens = {
  colors: {
    ink: "#10231d",
    muted: "#607068",
    accent: "#3ee58c",
    surface: "#f6f8f1",
    white: "#ffffff",
    border: "#dfe5da",
  },
  radii: { sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem", pill: "9999px" },
  spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem", "2xl": "3rem" },
  shadows: { card: "0 12px 30px rgb(49 83 67 / 5%)", floating: "0 20px 50px rgb(16 35 29 / 10%)" },
  sizes: { sidebar: "16rem", content: "90rem", header: "5rem" },
  typography: { fontFamily: "Arial, Helvetica, sans-serif", body: "0.875rem", heading: "2.25rem", display: "4.5rem" },
} as const;

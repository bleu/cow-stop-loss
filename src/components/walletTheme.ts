import { darkTheme, lightTheme } from "@rainbow-me/rainbowkit";

export type ColorTheme = "dark" | "light";

export function createWalletTheme(theme: ColorTheme) {
  const walletTheme = (theme === "light" ? lightTheme : darkTheme)({
    accentColor: "hsl(var(--primary))",
    accentColorForeground: "hsl(var(--primary-foreground))",
    borderRadius: "medium",
    overlayBlur: "small",
  });
  walletTheme.colors.modalBackground = "hsl(var(--popover))";
  walletTheme.colors.modalBorder = "hsl(var(--border))";
  walletTheme.colors.actionButtonBorder = "hsl(var(--border))";
  walletTheme.colors.actionButtonSecondaryBackground = "hsl(var(--background))";
  walletTheme.colors.generalBorder = "hsl(var(--border))";
  walletTheme.colors.modalText = "hsl(var(--foreground))";
  walletTheme.colors.modalTextSecondary = "hsl(var(--muted-foreground))";
  walletTheme.colors.modalTextDim = "hsl(var(--muted-foreground))";
  walletTheme.colors.actionButtonBorderMobile = "hsl(var(--border))";
  walletTheme.colors.menuItemBackground = "hsl(var(--primary) / 0.08)";
  walletTheme.colors.closeButton = "hsl(var(--muted-foreground))";
  walletTheme.colors.closeButtonBackground = "hsl(var(--muted))";
  walletTheme.colors.profileForeground = "hsl(var(--muted))";
  walletTheme.colors.profileAction = "hsl(var(--primary) / 0.08)";
  walletTheme.colors.profileActionHover = "hsl(var(--primary) / 0.14)";
  walletTheme.colors.selectedOptionBorder = "hsl(var(--primary) / 0.4)";
  walletTheme.colors.modalBackdrop = "hsl(217 72% 6% / 0.55)";
  walletTheme.colors.downloadTopCardBackground = "hsl(var(--primary) / 0.08)";
  walletTheme.colors.downloadBottomCardBackground = "hsl(var(--card))";
  walletTheme.radii.modal = "24px";
  walletTheme.radii.modalMobile = "24px";
  walletTheme.radii.actionButton = "14px";
  walletTheme.radii.connectButton = "14px";
  walletTheme.radii.menuButton = "12px";
  walletTheme.shadows.dialog = "0 24px 80px -24px hsl(217 72% 6% / 0.45)";
  walletTheme.fonts.body = "var(--font-family-sans), sans-serif";
  return walletTheme;
}

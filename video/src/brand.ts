import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Product tokens: src/app/globals.css.
export const brand = {
  night: "#081938",
  day: "#b3e6fa",
  ink: "hsl(222, 72%, 19%)",
  foreground: "hsl(220, 100%, 96%)",
  primary: "hsl(224, 100%, 74%)",
  peach: "hsl(16, 100%, 75%)",
  muted: "hsl(220, 56%, 78%)",
  frame: "hsl(223, 51%, 58%)",
  font: '"Chakra Petch", sans-serif',
};

export const fontsReady = Promise.all([
  loadFont({
    family: "Chakra Petch",
    url: staticFile("brand/ChakraPetch-Medium.ttf"),
    weight: "500",
  }),
  loadFont({
    family: "Chakra Petch",
    url: staticFile("brand/ChakraPetch-SemiBold.ttf"),
    weight: "600",
  }),
]);

import "@styles/tailwind.css";
import { StrictMode } from "react";
import { rootRender } from "@utils/render";
import { ScreenshotScreen } from "../screens/screenshot/screenshot";

rootRender.render(
  <StrictMode>
    <ScreenshotScreen />
  </StrictMode>,
);

import "./styles";
import { StrictMode } from "react";
import { rootRender } from "@utils/render";
import { CropArea } from "@screens/screenshot/components/crop-area";

rootRender.render(
  <StrictMode>
    <CropArea />
  </StrictMode>,
);

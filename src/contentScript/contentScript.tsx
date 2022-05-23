import { CropArea } from '@utils/image';
import { MessageRequest } from '@utils/MessageRequest';
import { rootRender } from '@utils/render';
import { useState, MouseEvent } from 'react';
import styled from 'styled-components';
import { copyBlobToClipboard, imageToBlob } from '@utils/image';

const App: React.FC = () => {
  const [firstPoint, setFirstPoints] = useState<{ x: number; y: number }>();
  const [cropArea, setCropArea] = useState<CropArea>();

  const onStartSelectingHandler = (event: MouseEvent) => {
    setFirstPoints({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const onMouseMoveHandler = (e: MouseEvent) => {
    if (firstPoint) {
      setCropArea({
        x: e.clientX > firstPoint.x ? firstPoint.x : e.clientX - 1,
        y: e.clientY > firstPoint.y ? firstPoint.y : e.clientY - 1,
        width: Math.abs(e.clientX - firstPoint.x),
        height: Math.abs(e.clientY - firstPoint.y),
      });
    }
  };

  const onMouseUpHandler = () => {
    if (cropArea) {
      chrome.runtime.sendMessage(
        {
          message: MessageRequest.CAPTURE_SCREEN,
          cropArea,
        },
        function ({ imgSrc }) {
          imageToBlob(imgSrc, cropArea).then((imageBlob) => copyBlobToClipboard(imageBlob));
        },
      );
    }
    rootRender.unmount();
  };

  return (
    <OverlayCursor onMouseDown={onStartSelectingHandler} onMouseMove={onMouseMoveHandler} onMouseUp={onMouseUpHandler}>
      <SelectedArea
        style={{
          width: cropArea?.width + 'px',
          height: cropArea?.height + 'px',
          left: cropArea?.x + 'px',
          top: cropArea?.y + 'px',
        }}
      />
    </OverlayCursor>
  );
};

rootRender.render(<App />);

const OverlayCursor = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;
  cursor: crosshair;
`;

const SelectedArea = styled.div`
  cursor: crosshair;
  box-sizing: border-box;
  position: fixed;
  z-index: 999999;
  border: gray 1px dotted;
  box-shadow: 0 0 0 50000px rgba(0, 0, 0, 0.5);
  background-color: transparent;
`;

import { CropArea as CropAreaType } from '@utils/image';
import { MessageRequest } from '@utils/MessageRequest';
import { rootRender } from '@utils/render';
import { setStorage } from '@utils/storage';
import { useState, MouseEvent } from 'react';
import './cropArea.css';

const CropArea: React.FC = () => {
  const [firstPoint, setFirstPoints] = useState<{ x: number; y: number }>();
  const [cropArea, setCropArea] = useState<CropAreaType>();

  const onMouseUpHandler = (cropArea: CropAreaType) => {
    if (cropArea) {
      chrome.runtime.sendMessage(
        {
          message: MessageRequest.CAPTURE_SCREEN,
          cropArea,
        },
        function ({ imgSrc }) {
          try {
            const screenshot = { capturedImage: imgSrc, cropArea: cropArea };
            setStorage({ screenshot });
            chrome.runtime.sendMessage({ message: MessageRequest.INSERT_FRAME });
          } catch (e) {
            console.log(e);
          }
        },
      );
    }
    rootRender.unmount();
  };

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

  return (
    <div
      className="overlayCursor"
      onMouseDown={onStartSelectingHandler}
      onMouseMove={onMouseMoveHandler}
      onMouseUp={() => cropArea && onMouseUpHandler(cropArea)}
    >
      <div
        className="selectedArea"
        style={{
          width: cropArea?.width + 'px',
          height: cropArea?.height + 'px',
          left: cropArea?.x + 'px',
          top: cropArea?.y + 'px',
        }}
      />
    </div>
  );
};

rootRender.render(<CropArea />);

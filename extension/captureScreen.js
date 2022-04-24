(() => {
  let selectedAreaDIV;
  let screenshotArea = {}; //x: 0, y: 0, width: 0, height: 0
  let firstPoint = {}; //x: 0, y: 0
  let style;

  function startSelecting(e) {
    e.preventDefault();
    firstPoint.x = e.clientX;
    firstPoint.y = e.clientY;

    document.addEventListener('mousemove', updateSelecting);
    document.addEventListener('mouseup', endSelecting);
  }

  function updateSelecting(e) {
    screenshotArea.x = e.clientX > firstPoint.x ? firstPoint.x : e.clientX - 1;
    screenshotArea.y = e.clientY > firstPoint.y ? firstPoint.y : e.clientY - 1;

    screenshotArea.width = Math.abs(e.clientX - firstPoint.x);
    screenshotArea.height = Math.abs(e.clientY - firstPoint.y);

    selectedAreaDIV.style.left = screenshotArea.x + 'px';
    selectedAreaDIV.style.top = screenshotArea.y + 'px';
    selectedAreaDIV.style.width = screenshotArea.width + 'px';
    selectedAreaDIV.style.height = screenshotArea.height + 'px';
  }

  async function endSelecting() {
    // here is the cropped image selectedArea;
    clearEvents();
    chrome.runtime.sendMessage(
      {
        type: 'captureScreen',
      },
      function ({ imgSrc }) {
        imageToBlob(imgSrc).then((imageBlob) => copyToClipboard(imageBlob));
      },
    );
  }

  async function copyToClipboard(imageBlob) {
    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          [imageBlob.type]: imageBlob,
        }),
      ]);
    } catch (e) {
      console.warn(e);
    }
  }

  function imageToBlob(imageURL) {
    const left = screenshotArea.x * window.devicePixelRatio;
    const top = screenshotArea.y * window.devicePixelRatio;
    const width = screenshotArea.width * window.devicePixelRatio;
    const height = screenshotArea.height * window.devicePixelRatio;

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    img.crossOrigin = '';
    img.src = imageURL;
    return new Promise((resolve, reject) => {
      img.onload = function () {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, left, top, width, height, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/png',
          0.95,
        );
      };

      img.onerror = function () {
        reject(new Error('Could not load image at ' + imageURL));
      };
    });
  }

  function clearEvents() {
    document.removeEventListener('mousedown', startSelecting);
    document.removeEventListener('mousemove', updateSelecting);
    document.removeEventListener('mouseup', endSelecting);
    removeCreatedHTMLElements();
  }

  function removeCreatedHTMLElements() {
    // remove selection area
    if (selectedAreaDIV && selectedAreaDIV.parentNode) {
      selectedAreaDIV.parentNode.removeChild(selectedAreaDIV);
    }

    // remove styles
    if (style && style.parentNode) {
      document.head.removeChild(style);
    }
  }

  function addGlobalStyles() {
    style = document.createElement('style');
    style.innerHTML = `
      html {
        cursor: crosshair;
      }
      .selectionBox {
        box-sizing: border-box;
        position: fixed;
        z-index: 999999;
        border: gray 1px dotted;
        box-shadow: 0 0 0 50000px rgba(0, 0, 0, 0.5);
        background-color: transparent;
      }
      `;
    document.head.appendChild(style);
  }

  return () => {
    addGlobalStyles();
    selectedAreaDIV = document.createElement('div');
    selectedAreaDIV.setAttribute('class', 'selectionBox');
    document.body.appendChild(selectedAreaDIV);

    document.addEventListener('mousedown', startSelecting);
  };
})()();

import { useEffect, useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";
import { createWorker } from "./workers/createWorker";
import * as ColorizationWorker from "./workers/colorization.worker";
import * as StyleWorker from "./workers/style.worker";
import debounce from "./utils/debounce";
import Logo from "./assets/logo.png";
import styles from "./styles.module.css";
import test from "./test-images/test.jpeg";
import "./App.css";
import * as tf from "@tensorflow/tfjs";

let colorizarionWorker = createWorker(ColorizationWorker);
let styleWorker = createWorker(StyleWorker);

const redrawCanvas = async (
  canvas: HTMLCanvasElement,
  imageData: Uint8ClampedArray
) => {
  tf.browser.toPixels(
    tf.tensor3d(Array.from(imageData), [400, 400, 4], "int32"),
    canvas
  );
};

function App() {
  let saveableCanvas: CanvasDraw | null = null;
  const colorizationCanvas = useRef(null);
  const styleCanvas = useRef(null);
  const [colorImageDataURL, setColorImageDataURL] = useState<string>("");
  const [styleImageData, setStyleImageData] =
    useState<Uint8ClampedArray | null>();
  const onDrawing = debounce(() => {
    if (saveableCanvas) {
      const dataUrl = (saveableCanvas as any).getDataURL(
        "jpg",
        false,
        "#ffffff"
      );
      setColorImageDataURL(dataUrl);
    }
  }, 100);
  // init
  useEffect(() => {
    onDrawing();
  }, []);

  useEffect(() => {
    const result = colorizarionWorker.predict(colorImageDataURL);
    result.then((res) => {
      setStyleImageData(res);
      requestIdleCallback(() => {
        if (colorizationCanvas && colorizationCanvas.current && res) {
          redrawCanvas(colorizationCanvas.current, res);
        }
      });
    });
  }, [colorImageDataURL]);

  // useEffect(() => {
  //   const result = styleWorker.predict(styleImageData);
  //   result.then((res) => {
  //     requestIdleCallback(() => {
  //       if (styleCanvas && styleCanvas.current && res) {
  //         redrawCanvas(styleCanvas.current, res);
  //       }
  //     });
  //   });
  // }, [styleImageData]);

  const saveableCanvasRefs = document.getElementsByClassName("canvas-draw");
  if (saveableCanvasRefs.length > 0) {
    (saveableCanvasRefs[0] as HTMLCanvasElement).style.removeProperty(
      "background"
    );
  }

  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={Logo}
          alt="logo"
          style={{ width: 60, marginTop: 20, borderRadius: "50%" }}
        />
      </div>

      <div>
        <h1>Draw it yourself</h1>
        <p style={{ fontSize: 20 }}>
          Our drawing board is baseded on 2 GAN model
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          margin: 40,
          flexWrap: "wrap",
        }}
      >
        <CanvasDraw
          ref={(canvasDraw) => (saveableCanvas = canvasDraw)}
          onChange={onDrawing}
          brushRadius={2}
          lazyRadius={1}
          hideGrid={true}
          style={{ margin: 20 }}
          imgSrc={test}
          className={`${styles.rainbow} canvas-draw`}
        />
        <canvas
          width="400px"
          height="400px"
          style={{ margin: 20 }}
          className={styles.rainbow}
          ref={colorizationCanvas}
        />
        <canvas
          width="400px"
          height="400px"
          style={{ margin: 20 }}
          className={styles.rainbow}
          ref={styleCanvas}
        />
      </div>
    </div>
  );
}

export default App;

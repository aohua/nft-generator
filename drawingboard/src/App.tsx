import { useEffect, useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";
// eslint-disable-next-line import/no-webpack-loader-syntax
import worker from "./workers/worker";
import debounce from "./utils/debounce";
import Logo from "./assets/logo.png";
import styles from "./styles.module.css";
import "./App.css";
import * as tf from "@tensorflow/tfjs";

let instance = worker();
instance.expensive(1000).then((count: number) => {
  console.log(`Ran ${count} loops`);
});

const COLORIZATION_MODEL_URL = "/colorization-model/model.json";

const normalize = (tensor: tf.Tensor) => {
  return tensor.cast("float32").div(127.5).sub(1);
};

const redrawCanvas = async (canvas: HTMLCanvasElement, tensor: tf.Tensor) => {
  tf.browser.toPixels(tensor as unknown as tf.Tensor3D, canvas);
};

const predict = (model: tf.LayersModel, tensor: tf.Tensor) => {
  const normalizedInput = normalize(tensor)
    .resizeBilinear([256, 256])
    .expandDims();
  const predicted = tf
    .squeeze(model.predict(normalizedInput) as unknown as tf.Tensor)
    .resizeBilinear([400, 400])
    .abs();
  return predicted;
};

function App() {
  let saveableCanvas: CanvasDraw | null = null;
  const displayCanvas = useRef(null);
  const [colorizationModel, setColorizationModel] = useState<tf.LayersModel>();
  const [imageDataURL, setImageDataURL] = useState("");
  useEffect(() => {
    async function fetchModel() {
      const model = await tf.loadLayersModel(COLORIZATION_MODEL_URL);
      setColorizationModel(model);
      console.log("downloaded");
    }
    fetchModel();
  }, []);

  useEffect(() => {
    const input = new Image();
    function handleOnLoad() {
      const inputTensor = tf.browser.fromPixels(input);
      if (colorizationModel && displayCanvas.current) {
        const predictOutput = predict(colorizationModel, inputTensor);
        redrawCanvas(displayCanvas.current, predictOutput);
      }
    }
    input.addEventListener("load", handleOnLoad);
    input.src = imageDataURL;
    return () => {
      input.removeEventListener("load", handleOnLoad);
    };
  }, [imageDataURL, colorizationModel]);

  const onDrawing = debounce(() => {
    if (saveableCanvas) {
      const dataUrl = (saveableCanvas as any).getDataURL(
        "jpg",
        undefined,
        "#ffffff"
      );
      setImageDataURL(dataUrl);
    }
  }, 100);

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
          Our drawing board is baeded on 2 GAN model
        </p>
      </div>

      <div
        style={{ display: "flex", justifyContent: "space-around", margin: 40 }}
      >
        <CanvasDraw
          ref={(canvasDraw) => (saveableCanvas = canvasDraw)}
          onChange={onDrawing}
          brushRadius={2}
          lazyRadius={1}
          hideGrid={true}
          className={`${styles.rainbow} canvas-draw`}
        />
        <canvas
          width="400px"
          height="400px"
          className={styles.rainbow}
          ref={displayCanvas}
        />
      </div>
    </div>
  );
}

export default App;

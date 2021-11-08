import React, { useEffect, useState } from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs";

const COLORIZATION_MODEL_URL = "/colorization-model/model.json";

const normalize = (tensor: tf.Tensor) => {
  return tensor.cast("float32").div(127.5).sub(1);
};
const redrawCanvas = async (canvas: HTMLCanvasElement, tensor: tf.Tensor) => {
  tf.browser.toPixels(tensor as unknown as tf.Tensor3D, canvas);
};
const predict = (model: tf.LayersModel, tensor: tf.Tensor) => {
  const normalizedInput = normalize(tensor).expandDims();
  const predicted = tf
    .squeeze(model.predict(normalizedInput) as unknown as tf.Tensor)
    .abs();
  return predicted;
};

function App() {
  const [colorizationModel, setColorizationModel] = useState<tf.LayersModel>();
  useEffect(() => {
    async function fetchModel() {
      const model = await tf.loadLayersModel(COLORIZATION_MODEL_URL);
      setColorizationModel(model);
    }
    fetchModel();
  }, []);

  return <div className="App"></div>;
}

export default App;

import * as tf from "@tensorflow/tfjs";
import InstanceNormalization from "../custom-layers/InstantNormalization";
tf.serialization.registerClass(InstanceNormalization);

const STYLE_MODEL_URL = "/style-model/model.json";
const styleModelFromDB = "indexeddb://style-model";
const normalize = (tensor: tf.Tensor) => {
  return tensor
    .slice(2, 3)
    .cast("float32")
    .div(tf.scalar(127.5))
    .sub(tf.scalar(1))
    .resizeBilinear([256, 256])
    .expandDims();
};

async function fetchStyleModel() {
  try {
    const modelFromDB = await tf.loadLayersModel(styleModelFromDB, {
      strict: false,
    });
    console.log("Model:loaded from DB");
    return modelFromDB;
  } catch {
    const model = await tf.loadLayersModel(STYLE_MODEL_URL);
    await model.save(styleModelFromDB);
    console.log("Model:downloaded");
    return model;
  }
}

export const predict = async (dataArray?: Uint8ClampedArray | null) => {
  const styleModel = await fetchStyleModel();
  if (dataArray) {
    let inputTensor = tf.tensor3d(
      Array.from(dataArray),
      [400, 400, 3],
      "int32"
    );
    const normalizedInput = normalize(inputTensor);
    const predicted = tf
      .squeeze(styleModel.predict(normalizedInput) as unknown as tf.Tensor)
      .mul(tf.scalar(0.5))
      .add(tf.scalar(0.5))
      .resizeBilinear([400, 400]);
    return await tf.browser.toPixels(predicted as unknown as tf.Tensor3D);
  }
  return null;
};

import * as tf from "@tensorflow/tfjs";
const COLORIZATION_MODEL_URL = "/colorization-model/model.json";
const colorizationModelFromDB = "indexeddb://colorization-model";
const normalize = (tensor: tf.Tensor) => {
  return tensor
    .cast("float32")
    .div(tf.scalar(127.5))
    .sub(tf.scalar(1))
    .resizeBilinear([256, 256])
    .expandDims();
};

async function fetchColorizationModel() {
  try {
    const modelFromDB = await tf.loadLayersModel(colorizationModelFromDB);
    console.log("Model:loaded from DB");
    return modelFromDB;
  } catch {
    const model = await tf.loadLayersModel(COLORIZATION_MODEL_URL);
    await model.save(colorizationModelFromDB);
    console.log("Model:downloaded");
    return model;
  }
}

export const predict = async (dataURL: string) => {
  const colorizationModel = await fetchColorizationModel();
  if (dataURL) {
    const blob = await (await fetch(dataURL)).blob();
    const bitmap = await createImageBitmap(blob);
    const inputTensor = tf.browser.fromPixels(bitmap);
    const normalizedInput = normalize(inputTensor);
    const predicted = tf
      .squeeze(
        colorizationModel.predict(normalizedInput) as unknown as tf.Tensor
      )
      .mul(tf.scalar(0.5))
      .add(tf.scalar(0.5))
      .resizeBilinear([400, 400]);
    return await tf.browser.toPixels(predicted as unknown as tf.Tensor3D);
  }
  return null;
};

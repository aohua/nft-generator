import * as tf from "@tensorflow/tfjs";

export default class InstanceNormalization extends tf.layers.Layer {
  epsilon = 1e-5;
  scale?: tf.LayerVariable;
  offset?: tf.LayerVariable;
  getConfig() {
    const config = super.getConfig();
    return config;
  }

  build(inputShape: number[]) {
    // initialize gamma
    this.scale = this.addWeight(
      "scale",
      [inputShape[inputShape.length - 1]],
      undefined,
      tf.initializers.randomNormal({ mean: 1, stddev: 0.02 }),
      undefined,
      true
    );
    // initialize beta
    this.offset = this.addWeight(
      "offset",
      [inputShape[inputShape.length - 1]],
      undefined,
      tf.initializers.zeros(),
      undefined,
      true
    ) as tf.LayerVariable;
  }

  call(inputs: tf.Tensor[]) {
    const { mean, variance } = tf.moments(inputs[0], [1, 2], true);
    const inv = tf.rsqrt(variance.add(tf.scalar(this.epsilon)));
    const normalized = inputs[0].sub(mean).mul(inv);
    const scale = this.scale?.read();
    const offset = this.offset?.read();
    if (scale && offset) {
      let outputs = normalized.mul(scale).add(offset);
      return outputs;
    }
    return normalized;
  }
  static get className() {
    return "InstanceNormalization";
  }
}

tf.serialization.registerClass(InstanceNormalization);

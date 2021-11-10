import * as tf from "@tensorflow/tfjs";
/*
class InstanceNormalization(tf.keras.layers.Layer):
  """Instance Normalization Layer (https://arxiv.org/abs/1607.08022)."""

  def __init__(self, epsilon=1e-5):
    super(InstanceNormalization, self).__init__()
    self.epsilon = epsilon

  def get_config(self):
    config = super(InstanceNormalization, self).get_config().copy()
    config.update({
            'epsilon': self.epsilon,
        })
    return config

  def build(self, input_shape):
    self.scale = self.add_weight(
        name='scale',
        shape=input_shape[-1:],
        initializer=tf.random_normal_initializer(1., 0.02),
        trainable=True)

    self.offset = self.add_weight(
        name='offset',
        shape=input_shape[-1:],
        initializer='zeros',
        trainable=True)

  def call(self, x):
    mean, variance = tf.nn.moments(x, axes=[1, 2], keepdims=True)
    inv = tf.math.rsqrt(variance + self.epsilon)
    normalized = (x - mean) * inv
    return self.scale * normalized + self.offset
*/
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
  /*
    mean, variance = tf.nn.moments(x, axes=[1, 2], keepdims=True)
    inv = tf.math.rsqrt(variance + self.epsilon)
    normalized = (x - mean) * inv
    return self.scale * normalized + self.offset
  */

  call(inputs: tf.Tensor[]) {
    // const mean = tf.mean(inputs[0], [-1], true);
    // const variance = tf.mean(tf.square(inputs[0].sub(mean)), [-1], true);
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

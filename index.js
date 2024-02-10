// Define a model for linear regression. The script tag makes `tf` available
// as a global variable.
const model = tf.sequential();
model.add(tf.layers.dense({units: 1, inputShape: [1]}));

model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

// Generate some synthetic data for training.
const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

function tensorflow_random_btn() {
    // Train the model using the data.
    model.fit(xs, ys, {epochs: 10}).then(() => {
        result = model.predict(tf.tensor2d([5], [1, 1]))
        document.getElementById('tensorflow_test').textContent = `predict: ${result}`;
    });
}
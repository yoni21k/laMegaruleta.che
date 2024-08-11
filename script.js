// script.js
let lastResults = []; // Historial de números
let model;
let totalPredictions = 0; // Total de predicciones realizadas
let correctPredictions = 0; // Total de predicciones correctas
let consecutiveLosses = 0; // Contador de pérdidas consecutivas
const maxConsecutiveLosses = 2; // Límite de pérdidas antes de cambiar la estrategia
let canPredict = true; // Controla si se pueden hacer nuevas predicciones

async function createModel() {
    model = tf.sequential();
    model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [1] }));
    model.add(tf.layers.dense({ units: 5, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 4, activation: 'softmax' })); // 4 categorías: 1-18, 19-36, pares, impares

    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
}

function handleKeydown(event) {
    if (event.key === 'Enter') {
        addNumber();
    }
}

async function addNumber() {
    const numberInput = document.getElementById('numberInput');
    const number = parseInt(numberInput.value);

    if (isNaN(number) || number < 1 || number > 36) {
        alert('Por favor, ingresa un número válido del 1 al 36.');
        return;
    }

    lastResults.push(number);
    const newItem = document.createElement('li');
    newItem.textContent = number;
    document.getElementById('numberList').appendChild(newItem);

    numberInput.value = ''; // Limpiar el campo de entrada

    if (lastResults.length > 10) {
        lastResults.shift(); // Mantener solo los últimos 10 resultados
    }

    if (lastResults.length >= 3 && canPredict) {
        await trainModel();
        predictNext();
    }
}

async function trainModel() {
    if (lastResults.length < 2) return; // Necesitamos al menos 2 números para entrenar

    const xs = tf.tensor2d(lastResults.slice(0, -1).map(num => [num])); // Entradas
    const ys = tf.tensor2d(lastResults.slice(1).map(num => {
        if (num <= 18) return [1, 0, 0, 0]; // 1-18
        if (num <= 36) return [0, 1, 0, 0]; // 19-36
        return [0, 0, 0, 0]; // No debería ocurrir
    }));

    await model.fit(xs, ys, { epochs: 100 });
}

function predictNext() {
    const lastThree = lastResults.slice(-3);
    let prediction;

    // Lógica de predicción basada en los últimos tres números
    if (lastThree.every(num => num % 2 === 0)) { // Todos pares
        prediction = 'Impar';
    } else if (lastThree.every(num => num % 2 !== 0)) { // Todos impares
        prediction = 'Par';
    } else {
        // Aquí puedes agregar más lógica para predecir colores y altos/bajos
        prediction = 'Rojo'; // Cambia este valor según tu lógica
    }

    displayPrediction(prediction);
}

function displayPrediction(prediction) {
    document.getElementById('prediction').innerText = `Mejor opción de apuesta: ${prediction}`;
}

function updateEffectiveness(isWin) {
    totalPredictions++;
    if (isWin) {
        correctPredictions++;
        consecutiveLosses = 0; // Reiniciar contador de pérdidas
    } else {
        consecutiveLosses++;
        if (consecutiveLosses >= maxConsecutiveLosses) {
            changePredictionStrategy();
        }
    }
    updateEffectivenessDisplay();
}

function updateEffectivenessDisplay() {
    const effectivenessPercentage = (correctPredictions / totalPredictions) * 100 || 0;
    document.getElementById('effectivenessPercentage').innerText = `${effectivenessPercentage.toFixed(2)}%`;
    const progressBar = document.getElementById('progress');
    progressBar.style.width = `${effectivenessPercentage}%`;

    // Cambiar el color de la barra si el porcentaje es mayor al 30%
    if (effectivenessPercentage > 30) {
        progressBar.classList.add('red');
    } else {
        progressBar.classList.remove('red');
    }
}

function changePredictionStrategy() {
    canPredict = false; // Desactivar nuevas predicciones
    displayPrediction('Se han detectado dos pérdidas consecutivas. Cambiando la estrategia de predicción...');

    // Esperar 3 resultados antes de permitir nuevas predicciones
    setTimeout(() => {
        canPredict = true; // Rehabilitar predicciones
        displayPrediction('Puedes hacer una nueva predicción.');
    }, 3000); // Esperar 3 segundos
}

function suggestRebet() {
    // Mostrar mensaje al usuario para "Reapostar"
    displayPrediction('Reapostar para la siguiente ronda.');
}

// Inicializar el modelo
createModel();

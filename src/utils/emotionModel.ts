// Simple neural network for emotion classification
export class EmotionModel {
  private weights: number[][];
  private biases: number[];
  private isTrained: boolean = false;
  
  private readonly emotions = ['neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'];
  private readonly inputSize = 39; // 13 MFCC + 4 spectral + 3 prosodic features (averaged)
  private readonly hiddenSize = 64;
  private readonly outputSize = 8;

  constructor() {
    this.initializeWeights();
  }

  private initializeWeights() {
    // Initialize weights randomly
    this.weights = [
      // Input to hidden layer
      Array.from({ length: this.hiddenSize }, () => 
        Array.from({ length: this.inputSize }, () => (Math.random() - 0.5) * 0.1)
      ).flat().reduce((acc, _, i) => {
        const row = Math.floor(i / this.inputSize);
        if (!acc[row]) acc[row] = [];
        acc[row].push((Math.random() - 0.5) * 0.1);
        return acc;
      }, [] as number[][]),
      
      // Hidden to output layer
      Array.from({ length: this.outputSize }, () => 
        Array.from({ length: this.hiddenSize }, () => (Math.random() - 0.5) * 0.1)
      )
    ];

    this.biases = [
      Array.from({ length: this.hiddenSize }, () => 0),
      Array.from({ length: this.outputSize }, () => 0)
    ];
  }

  // Train the model with RAVDESS dataset
  async trainModel(trainingData: { features: number[]; emotion: string }[]): Promise<void> {
    console.log('Starting model training with', trainingData.length, 'samples...');
    
    const epochs = 100;
    const learningRate = 0.01;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      
      // Shuffle training data
      const shuffledData = [...trainingData].sort(() => Math.random() - 0.5);
      
      for (const sample of shuffledData) {
        const features = sample.features;
        const emotionIndex = this.emotions.indexOf(sample.emotion);
        
        if (emotionIndex === -1) continue;
        
        // Forward pass
        const { hiddenOutput, finalOutput } = this.forward(features);
        
        // Create target vector (one-hot encoding)
        const target = Array(this.outputSize).fill(0);
        target[emotionIndex] = 1;
        
        // Calculate loss (cross-entropy)
        const loss = this.calculateLoss(finalOutput, target);
        totalLoss += loss;
        
        // Backward pass
        this.backward(features, hiddenOutput, finalOutput, target, learningRate);
      }
      
      if (epoch % 10 === 0) {
        console.log(`Epoch ${epoch}, Average Loss: ${(totalLoss / trainingData.length).toFixed(4)}`);
      }
    }
    
    this.isTrained = true;
    console.log('Model training completed!');
  }

  // Predict emotion from features
  predict(features: number[]): { emotion: string; confidence: number; probabilities: number[] } {
    if (!this.isTrained) {
      // If not trained, use rule-based prediction based on features
      return this.ruleBasedPrediction(features);
    }

    const { finalOutput } = this.forward(features);
    
    // Apply softmax to get probabilities
    const probabilities = this.softmax(finalOutput);
    
    // Find the emotion with highest probability
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const emotion = this.emotions[maxIndex];
    const confidence = probabilities[maxIndex];
    
    return { emotion, confidence, probabilities };
  }

  private forward(features: number[]): { hiddenOutput: number[]; finalOutput: number[] } {
    // Input to hidden layer
    const hiddenInput = this.weights[0].map((weightRow, i) => 
      weightRow.reduce((sum, weight, j) => sum + weight * features[j], 0) + this.biases[0][i]
    );
    
    // Apply ReLU activation
    const hiddenOutput = hiddenInput.map(x => Math.max(0, x));
    
    // Hidden to output layer
    const finalInput = this.weights[1].map((weightRow, i) => 
      weightRow.reduce((sum, weight, j) => sum + weight * hiddenOutput[j], 0) + this.biases[1][i]
    );
    
    return { hiddenOutput, finalOutput: finalInput };
  }

  private backward(features: number[], hiddenOutput: number[], finalOutput: number[], target: number[], learningRate: number) {
    // Calculate output layer gradients
    const outputGradients = finalOutput.map((output, i) => output - target[i]);
    
    // Update output layer weights and biases
    for (let i = 0; i < this.weights[1].length; i++) {
      for (let j = 0; j < this.weights[1][i].length; j++) {
        this.weights[1][i][j] -= learningRate * outputGradients[i] * hiddenOutput[j];
      }
      this.biases[1][i] -= learningRate * outputGradients[i];
    }
    
    // Calculate hidden layer gradients
    const hiddenGradients = hiddenOutput.map((_, j) => {
      const gradient = outputGradients.reduce((sum, outGrad, i) => 
        sum + outGrad * this.weights[1][i][j], 0
      );
      return hiddenOutput[j] > 0 ? gradient : 0; // ReLU derivative
    });
    
    // Update hidden layer weights and biases
    for (let i = 0; i < this.weights[0].length; i++) {
      for (let j = 0; j < this.weights[0][i].length; j++) {
        this.weights[0][i][j] -= learningRate * hiddenGradients[i] * features[j];
      }
      this.biases[0][i] -= learningRate * hiddenGradients[i];
    }
  }

  private calculateLoss(predictions: number[], targets: number[]): number {
    // Cross-entropy loss
    const softmaxPreds = this.softmax(predictions);
    return -targets.reduce((sum, target, i) => 
      sum + target * Math.log(Math.max(softmaxPreds[i], 1e-15)), 0
    );
  }

  private softmax(values: number[]): number[] {
    const maxVal = Math.max(...values);
    const expValues = values.map(v => Math.exp(v - maxVal));
    const sumExp = expValues.reduce((sum, exp) => sum + exp, 0);
    return expValues.map(exp => exp / sumExp);
  }

  private ruleBasedPrediction(features: number[]): { emotion: string; confidence: number; probabilities: number[] } {
    // Rule-based prediction when model is not trained
    // This analyzes the actual audio features to make predictions
    
    const [
      spectralCentroid, spectralRolloff, zcr, rmsEnergy,
      f0, pitchVariation, speakingRate,
      ...mfccFeatures
    ] = features;

    // Analyze features to determine emotion
    let emotionScores = {
      neutral: 0.2,
      calm: 0.1,
      happy: 0.1,
      sad: 0.1,
      angry: 0.1,
      fearful: 0.1,
      disgust: 0.1,
      surprised: 0.1
    };

    // High energy and pitch variation suggests excitement/anger/surprise
    if (rmsEnergy > 0.1 && pitchVariation > 50) {
      if (f0 > 200) {
        emotionScores.surprised += 0.3;
        emotionScores.happy += 0.2;
      } else {
        emotionScores.angry += 0.3;
      }
    }

    // Low energy suggests calm/sad
    if (rmsEnergy < 0.05) {
      if (f0 < 150) {
        emotionScores.sad += 0.3;
      } else {
        emotionScores.calm += 0.3;
      }
    }

    // High spectral centroid suggests bright emotions
    if (spectralCentroid > 0.6) {
      emotionScores.happy += 0.2;
      emotionScores.surprised += 0.1;
    }

    // Low spectral centroid suggests darker emotions
    if (spectralCentroid < 0.3) {
      emotionScores.sad += 0.2;
      emotionScores.angry += 0.1;
    }

    // High zero crossing rate suggests fricatives (fear/disgust)
    if (zcr > 0.1) {
      emotionScores.fearful += 0.2;
      emotionScores.disgust += 0.1;
    }

    // Fast speaking rate suggests excitement
    if (speakingRate > 5) {
      emotionScores.happy += 0.1;
      emotionScores.surprised += 0.1;
    }

    // Slow speaking rate suggests sadness/calm
    if (speakingRate < 2) {
      emotionScores.sad += 0.1;
      emotionScores.calm += 0.1;
    }

    // Normalize scores
    const totalScore = Object.values(emotionScores).reduce((sum, score) => sum + score, 0);
    const probabilities = Object.values(emotionScores).map(score => score / totalScore);
    
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const emotion = this.emotions[maxIndex];
    const confidence = probabilities[maxIndex];

    return { emotion, confidence, probabilities };
  }

  getModelInfo() {
    return {
      name: "EmotiNet-RAVDESS",
      version: "v2.1.0",
      architecture: "Neural Network (2-layer MLP)",
      inputFeatures: this.inputSize,
      hiddenUnits: this.hiddenSize,
      outputClasses: this.outputSize,
      emotions: this.emotions,
      isTrained: this.isTrained,
      trainingStatus: this.isTrained ? "Trained" : "Using rule-based prediction"
    };
  }

  // Export model for saving
  exportModel() {
    return {
      weights: this.weights,
      biases: this.biases,
      isTrained: this.isTrained,
      emotions: this.emotions
    };
  }

  // Import model from saved data
  importModel(modelData: any) {
    this.weights = modelData.weights;
    this.biases = modelData.biases;
    this.isTrained = modelData.isTrained;
  }
}
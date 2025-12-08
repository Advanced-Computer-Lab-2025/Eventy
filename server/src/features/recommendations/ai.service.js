import { pipeline } from "@xenova/transformers";

class AIModelService {
  static instance = null;
  static modelPromise = null;

  static async getInstance() {
    if (!this.instance) {
      if (!this.modelPromise) {
        console.log("Loading AI Model (Xenova/all-MiniLM-L6-v2)...");
        this.modelPromise = pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2"
        );
      }
      this.instance = await this.modelPromise;
      console.log("AI Model Loaded.");
    }
    return this.instance;
  }
}

export default AIModelService;

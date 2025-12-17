import logger from "../../utils/logger.js";
import { pipeline } from "@xenova/transformers";

class AIModelService {
  static instance = null;
  static modelPromise = null;

  static async getInstance() {
    if (!this.instance) {
      if (!this.modelPromise) {
        logger.info("Loading AI Model (Xenova/all-MiniLM-L6-v2)...");
        this.modelPromise = pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2"
        );
      }
      this.instance = await this.modelPromise;
      logger.info("AI Model Loaded.");
    }
    return this.instance;
  }
}

export default AIModelService;

/**
 * Models Module
 * 
 * This module provides adapters for various AI language models
 * and utilities for working with them in the application.
 */

// Re-export adapter functionality
export * from './adapter';

// Import model adapter
import { 
  initializeDefaultModel, 
  BaseLanguageModel, 
  ModelConfig,
  ModelType 
} from './adapter';
import { logger } from '../utils/logger';
import config from '../config';

// Global model instance
let defaultModel: BaseLanguageModel;

/**
 * Initialize the models module
 * 
 * This function sets up the default model and other model-related configuration.
 */
export const initializeModels = async (): Promise<void> => {
  try {
    logger.info('Initializing models module...');
    
    // Initialize the default model
    defaultModel = initializeDefaultModel();
    
    logger.info(`Default model initialized: ${config.ai.defaultModel}`);
  } catch (error) {
    logger.error('Error initializing models:', error);
    throw error;
  }
};

/**
 * Get the default model instance
 * 
 * @returns {BaseLanguageModel} Default model instance
 */
export const getDefaultModel = (): BaseLanguageModel => {
  if (!defaultModel) {
    logger.warn('Default model not initialized, initializing now');
    defaultModel = initializeDefaultModel();
  }
  
  return defaultModel;
};

/**
 * Create a model with specific configuration
 * 
 * @param {Partial<ModelConfig>} config - Model configuration
 * @returns {BaseLanguageModel} Configured model instance
 */
export const createModelWithConfig = (config: Partial<ModelConfig>): BaseLanguageModel => {
  // Merge with default configuration
  const defaultConfig: ModelConfig = {
    type: ModelType.OPENAI,
    modelName: 'gpt-3.5-turbo'
  };
  
  const mergedConfig: ModelConfig = {
    ...defaultConfig,
    ...config
  };
  
  return initializeDefaultModel();
};

/**
 * Check model health/availability
 * 
 * @returns {Promise<boolean>} Whether the model is available
 */
export const checkModelHealth = async (): Promise<boolean> => {
  try {
    // Simple check to see if the model can respond
    const model = getDefaultModel();
    await model.predict('hello');
    return true;
  } catch (error) {
    logger.error('Model health check failed:', error);
    return false;
  }
};
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { BaseLanguageModel } from 'langchain/base_language';
import { OpenAI } from 'langchain/llms/openai';
import { logger } from '../utils/logger';
import config from '../config';

/**
 * Model Adapter Module
 * 
 * Provides a unified interface for interacting with different language models
 * and AI services. This adapter makes it easy to switch between different
 * LLM providers by abstracting the implementation details.
 */

// Model types
export enum ModelType {
  OPENAI = 'openai',
  AZURE_OPENAI = 'azure-openai',
  ANTHROPIC = 'anthropic',
  HUGGINGFACE = 'huggingface',
  GOOGLE = 'google'
}

// Model configuration
export interface ModelConfig {
  type: ModelType;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

/**
 * Create a language model instance based on the configuration
 * 
 * @param {ModelConfig} modelConfig - Model configuration
 * @returns {BaseLanguageModel} Language model instance
 */
export const createModel = (modelConfig: ModelConfig): BaseLanguageModel => {
  logger.info(`Creating language model of type ${modelConfig.type}`);
  
  switch (modelConfig.type) {
    case ModelType.OPENAI:
      return new OpenAI({
        modelName: modelConfig.modelName || 'gpt-3.5-turbo',
        openAIApiKey: config.ai.openai.apiKey,
        temperature: modelConfig.temperature || 0.7,
        maxTokens: modelConfig.maxTokens,
        topP: modelConfig.topP,
        frequencyPenalty: modelConfig.frequencyPenalty,
        presencePenalty: modelConfig.presencePenalty,
        stop: modelConfig.stopSequences
      });
    
    // Add other model providers as needed
    
    default:
      logger.warn(`Unsupported model type: ${modelConfig.type}, falling back to OpenAI`);
      return new OpenAI({
        modelName: 'gpt-3.5-turbo',
        openAIApiKey: config.ai.openai.apiKey,
        temperature: 0.7
      });
  }
};

/**
 * Create a LangChain for processing natural language commands
 * 
 * @param {BaseLanguageModel} model - Language model
 * @param {string} template - Prompt template
 * @param {string[]} inputVariables - Input variables for the template
 * @returns {LLMChain} LangChain instance
 */
export const createChain = (
  model: BaseLanguageModel,
  template: string,
  inputVariables: string[]
): LLMChain => {
  const prompt = new PromptTemplate({
    template,
    inputVariables
  });
  
  return new LLMChain({
    llm: model,
    prompt
  });
};

/**
 * Process a natural language query with the given model
 * 
 * @param {BaseLanguageModel} model - Language model
 * @param {string} query - User query
 * @param {Record<string, any>} context - Additional context
 * @returns {Promise<string>} Model response
 */
export const processQuery = async (
  model: BaseLanguageModel,
  query: string,
  context: Record<string, any> = {}
): Promise<string> => {
  try {
    logger.info(`Processing query with model: ${query}`);
    
    const result = await model.predict(
      `Context: ${JSON.stringify(context)}\nQuery: ${query}`
    );
    
    return result;
  } catch (error) {
    logger.error('Error processing query with model:', error);
    throw error;
  }
};

/**
 * Extract structured information from text using a language model
 * 
 * @param {BaseLanguageModel} model - Language model
 * @param {string} text - Text to extract information from
 * @param {string} schema - JSON schema or description of expected structure
 * @returns {Promise<any>} Extracted structured information
 */
export const extractStructuredData = async (
  model: BaseLanguageModel,
  text: string,
  schema: string
): Promise<any> => {
  try {
    logger.info('Extracting structured data from text');
    
    const prompt = `
Extract the following information from the text below according to this schema:
${schema}

Text:
${text}

Return ONLY a valid JSON object matching the schema. Do not include any explanation or text outside the JSON.
`;
    
    const result = await model.predict(prompt);
    
    try {
      return JSON.parse(result);
    } catch (parseError) {
      logger.error('Error parsing structured data from model output:', parseError);
      throw new Error('Failed to extract structured data from text');
    }
  } catch (error) {
    logger.error('Error extracting structured data:', error);
    throw error;
  }
};

/**
 * Generate calendar events from natural language
 * 
 * @param {BaseLanguageModel} model - Language model
 * @param {string} input - Natural language input
 * @returns {Promise<any>} Generated calendar event data
 */
export const generateCalendarEvent = async (
  model: BaseLanguageModel,
  input: string
): Promise<any> => {
  try {
    logger.info('Generating calendar event from input');
    
    const schema = `
{
  "title": "Event title",
  "description": "Event description",
  "startTime": "ISO date string",
  "endTime": "ISO date string",
  "location": "Optional location",
  "attendees": ["email addresses"]
}`;
    
    return extractStructuredData(model, input, schema);
  } catch (error) {
    logger.error('Error generating calendar event:', error);
    throw error;
  }
};

/**
 * Generate a document outline from natural language
 * 
 * @param {BaseLanguageModel} model - Language model
 * @param {string} topic - Document topic
 * @param {Record<string, any>} options - Additional options
 * @returns {Promise<string>} Document outline
 */
export const generateDocumentOutline = async (
  model: BaseLanguageModel,
  topic: string,
  options: Record<string, any> = {}
): Promise<string> => {
  try {
    logger.info(`Generating document outline for topic: ${topic}`);
    
    const detailLevel = options.detailLevel || 'moderate';
    const format = options.format || 'markdown';
    
    const prompt = `
Generate a document outline for the following topic: ${topic}

Detail level: ${detailLevel}
Format: ${format}

Include main sections and subsections. For each section, include a brief description of what should be covered.
`;
    
    return model.predict(prompt);
  } catch (error) {
    logger.error('Error generating document outline:', error);
    throw error;
  }
};

/**
 * Initialize default model
 * 
 * @returns {BaseLanguageModel} Default language model
 */
export const initializeDefaultModel = (): BaseLanguageModel => {
  const defaultConfig: ModelConfig = {
    type: ModelType.OPENAI,
    modelName: config.ai.defaultModel || 'gpt-3.5-turbo',
    temperature: config.ai.temperature || 0.7,
    maxTokens: config.ai.maxTokens || 1000
  };
  
  return createModel(defaultConfig);
};

// Export the BaseLanguageModel type for use in other modules
export { BaseLanguageModel };
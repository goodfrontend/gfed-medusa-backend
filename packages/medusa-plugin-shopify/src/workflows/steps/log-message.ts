import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

type LogMessageStepInput = {
  message: string;
};

export const logMessageStep = createStep(
  'log-message',
  async ({ message }: LogMessageStepInput, { container }) => {
    const logger = container.resolve('logger');

    logger.info(message);

    return new StepResponse(1);
  }
);

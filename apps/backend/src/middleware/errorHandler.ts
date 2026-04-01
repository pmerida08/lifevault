import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(
  error: FastifyError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  request.log.error(error);

  if (error instanceof ZodError) {
    reply.status(400).send({
      error: 'Validation Error',
      message: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      statusCode: 400,
    });
    return;
  }

  const statusCode = (error as FastifyError).statusCode ?? 500;

  reply.status(statusCode).send({
    error: statusCode === 500 ? 'Internal Server Error' : error.message,
    message: statusCode === 500 ? 'An unexpected error occurred' : error.message,
    statusCode,
  });
}

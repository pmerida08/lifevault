import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import { AssistantQuerySchema } from './assistant.schema.js';
import { queryAssistant, getConversationHistory, clearConversation } from './assistant.service.js';

export async function assistantRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  // POST /assistant/query
  fastify.post('/query', async (request, reply) => {
    const input = AssistantQuerySchema.parse(request.body);
    const response = await queryAssistant(request.user.sub, input);
    return reply.send({ data: response });
  });

  // GET /assistant/history
  fastify.get('/history', async (request, reply) => {
    const messages = await getConversationHistory(request.user.sub);
    return reply.send({ data: messages });
  });

  // DELETE /assistant/history
  fastify.delete('/history', async (request, reply) => {
    await clearConversation(request.user.sub);
    return reply.status(204).send();
  });
}

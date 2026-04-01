import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import { CreateEventSchema, UpdateEventSchema, EventQuerySchema } from './events.schema.js';
import { listEvents, getEvent, createEvent, updateEvent, deleteEvent } from './events.service.js';

export async function eventRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', async (request, reply) => {
    const query = EventQuerySchema.parse(request.query);
    const { rows, total } = await listEvents(request.user.sub, query);
    return reply.send({ data: rows, meta: { total, page: query.page, limit: query.limit } });
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const event = await getEvent(request.params.id, request.user.sub);
    if (!event) return reply.status(404).send({ error: 'Not Found', message: 'Event not found', statusCode: 404 });
    return reply.send({ data: event });
  });

  fastify.post('/', async (request, reply) => {
    const input = CreateEventSchema.parse(request.body);
    const event = await createEvent(request.user.sub, input);
    return reply.status(201).send({ data: event });
  });

  fastify.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const input = UpdateEventSchema.parse(request.body);
    const event = await updateEvent(request.params.id, request.user.sub, input);
    if (!event) return reply.status(404).send({ error: 'Not Found', message: 'Event not found', statusCode: 404 });
    return reply.send({ data: event });
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const deleted = await deleteEvent(request.params.id, request.user.sub);
    if (!deleted) return reply.status(404).send({ error: 'Not Found', message: 'Event not found', statusCode: 404 });
    return reply.status(204).send();
  });
}

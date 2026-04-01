import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from './tasks.schema.js';
import { listTasks, getTask, createTask, updateTask, deleteTask } from './tasks.service.js';

export async function taskRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', async (request, reply) => {
    const query = TaskQuerySchema.parse(request.query);
    const { rows, total } = await listTasks(request.user.sub, query);
    return reply.send({ data: rows, meta: { total, page: query.page, limit: query.limit } });
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const task = await getTask(request.params.id, request.user.sub);
    if (!task) return reply.status(404).send({ error: 'Not Found', message: 'Task not found', statusCode: 404 });
    return reply.send({ data: task });
  });

  fastify.post('/', async (request, reply) => {
    const input = CreateTaskSchema.parse(request.body);
    const task = await createTask(request.user.sub, input);
    return reply.status(201).send({ data: task });
  });

  fastify.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const input = UpdateTaskSchema.parse(request.body);
    const task = await updateTask(request.params.id, request.user.sub, input);
    if (!task) return reply.status(404).send({ error: 'Not Found', message: 'Task not found', statusCode: 404 });
    return reply.send({ data: task });
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const deleted = await deleteTask(request.params.id, request.user.sub);
    if (!deleted) return reply.status(404).send({ error: 'Not Found', message: 'Task not found', statusCode: 404 });
    return reply.status(204).send();
  });
}

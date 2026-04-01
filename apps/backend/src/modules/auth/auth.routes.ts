import type { FastifyInstance } from 'fastify';
import { RegisterSchema, LoginSchema } from './auth.schema.js';
import { registerUser, loginUser } from './auth.service.js';
import { authenticate } from '../../middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /auth/register
  fastify.post('/register', async (request, reply) => {
    const body = RegisterSchema.parse(request.body);
    const user = await registerUser(body);
    const token = fastify.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '7d' }
    );
    return reply.status(201).send({ data: { user, token } });
  });

  // POST /auth/login
  fastify.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body);
    const user = await loginUser(body);
    const token = fastify.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '7d' }
    );
    return reply.send({ data: { user, token } });
  });

  // GET /auth/me
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const { sub } = request.user;
    const { rows } = await fastify.db.query(
      'SELECT id, email, name, avatar_url, plan, created_at FROM users WHERE id = $1',
      [sub]
    );
    if (!rows[0]) return reply.status(404).send({ error: 'Not found', message: 'User not found', statusCode: 404 });
    return reply.send({ data: rows[0] });
  });
}

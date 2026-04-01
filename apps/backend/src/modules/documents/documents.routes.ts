import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import { CreateDocumentSchema, UpdateDocumentSchema, DocumentQuerySchema } from './documents.schema.js';
import { listDocuments, getDocument, createDocument, updateDocument, deleteDocument } from './documents.service.js';
import { uploadFile, getPresignedUrl } from '../../services/storage/s3.service.js';
import { v4 as uuidv4 } from 'uuid';

export async function documentRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  // GET /documents
  fastify.get('/', async (request, reply) => {
    const query = DocumentQuerySchema.parse(request.query);
    const { rows, total } = await listDocuments(request.user.sub, query);
    return reply.send({ data: rows, meta: { total, page: query.page, limit: query.limit } });
  });

  // GET /documents/:id
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const doc = await getDocument(request.params.id, request.user.sub);
    if (!doc) return reply.status(404).send({ error: 'Not Found', message: 'Document not found', statusCode: 404 });
    return reply.send({ data: doc });
  });

  // POST /documents (multipart upload)
  fastify.post('/', async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'Bad Request', message: 'No file provided', statusCode: 400 });

    const body = CreateDocumentSchema.parse(JSON.parse((data.fields as Record<string, { value: string }>).meta?.value ?? '{}'));
    const fileKey = `${request.user.sub}/${uuidv4()}-${data.filename}`;
    const fileBuffer = await data.toBuffer();

    const fileUrl = await uploadFile(fileKey, fileBuffer, data.mimetype);
    const doc = await createDocument(request.user.sub, body, {
      url: fileUrl,
      name: data.filename,
      size: fileBuffer.length,
      mimeType: data.mimetype,
    });

    return reply.status(201).send({ data: doc });
  });

  // GET /documents/:id/download  (presigned URL)
  fastify.get<{ Params: { id: string } }>('/:id/download', async (request, reply) => {
    const doc = await getDocument(request.params.id, request.user.sub);
    if (!doc) return reply.status(404).send({ error: 'Not Found', message: 'Document not found', statusCode: 404 });

    const key = new URL(doc.file_url).pathname.slice(1);
    const url = await getPresignedUrl(key);
    return reply.send({ data: { url, expires_in: 300 } });
  });

  // PATCH /documents/:id
  fastify.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const input = UpdateDocumentSchema.parse(request.body);
    const doc = await updateDocument(request.params.id, request.user.sub, input);
    if (!doc) return reply.status(404).send({ error: 'Not Found', message: 'Document not found', statusCode: 404 });
    return reply.send({ data: doc });
  });

  // DELETE /documents/:id
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const deleted = await deleteDocument(request.params.id, request.user.sub);
    if (!deleted) return reply.status(404).send({ error: 'Not Found', message: 'Document not found', statusCode: 404 });
    return reply.status(204).send();
  });
}

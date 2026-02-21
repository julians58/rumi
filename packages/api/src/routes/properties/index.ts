import type { FastifyPluginAsync } from 'fastify';
import { createPropertyHandler, listPropertiesHandler, getPropertyHandler, updatePropertyHandler, deletePropertyHandler, getMyPropertiesHandler, recordViewHandler, getViewedPropertiesHandler, uploadImageHandler } from './properties.handler';

const propertiesRoutes: FastifyPluginAsync = async (app) => {
  app.post('/', { preHandler: [app.requireAuth] }, createPropertyHandler);
  app.get('/', { preHandler: [app.optionalAuth] }, listPropertiesHandler);
  app.get('/me', { preHandler: [app.requireAuth] }, getMyPropertiesHandler);
  app.get('/viewed', { preHandler: [app.requireAuth] }, getViewedPropertiesHandler);
  app.get('/:id', getPropertyHandler);
  app.put('/:id', { preHandler: [app.requireAuth] }, updatePropertyHandler);
  app.delete('/:id', { preHandler: [app.requireAuth] }, deletePropertyHandler);
  app.post('/:id/view', { preHandler: [app.requireAuth] }, recordViewHandler);
  app.post('/:id/images', { preHandler: [app.requireAuth] }, uploadImageHandler);
};

export default propertiesRoutes;

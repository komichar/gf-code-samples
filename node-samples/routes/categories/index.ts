import Joi from '@hapi/joi';
import { ServerRoute } from '@hapi/hapi';
import { AuthRequest } from '../../interfaces/request';
import { PERMISSIONS } from '../../../entities/Permission';
import getCategories from '../../../repo/categories/getCategories';

const SubcategorySchema = Joi.object({
  id: Joi.number(),
  name: Joi.string(),
  reportTypeId: Joi.number(),
});

const CategorySchema = Joi.object({
  id: Joi.number(),
  name: Joi.string(),
  reportTypeIds: Joi.array().items(Joi.number()),
  subcategories: Joi.array().items(SubcategorySchema),
});

const categoriesResponseSchema = Joi.array().items(CategorySchema).label('CategoriesResponse');

const v1categories: ServerRoute = {
  method: 'GET',
  path: '/v1/categories',
  options: {
    auth: {
      access: {
        scope: [
          PERMISSIONS.STUDIES_LIST_ALL,
          PERMISSIONS.STUDIES_LIST_BASIC,
          PERMISSIONS.STUDIES_LIST_ASSIGNED,
        ],
      },
    },
    notes: 'Get all categories with subcategories',
    description: 'Return top level categories with their subcategories and filter ids',
    tags: ['api', 'categories'],
    response: {
      schema: categoriesResponseSchema,
    },
  },
  handler: async (request: AuthRequest) => {
    return await getCategories(request.auth.credentials.user.id);
  },
};

export default v1categories;

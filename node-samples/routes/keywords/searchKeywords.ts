import { ServerRoute } from '@hapi/hapi';
import Joi from '@hapi/joi';
import { PERMISSIONS } from '../../../entities/Permission';
import { searchKeywords } from '../../../repo/e2e/keywords';
import { AuthRequest } from '../../interfaces/request';

const Keyword = Joi.object({
  id: Joi.string(),
  value: Joi.string(),
  countryCode: Joi.string().length(2),
}).label('Keyword');

const KeywordsSearchResponse = Joi.array().items(Keyword).label('KeywordsSearchResponse');

const route: ServerRoute = {
  method: 'GET',
  path: '/v1/study-requests/keywords',
  options: {
    auth: {
      scope: [PERMISSIONS.STUDY_REQUESTS_CREATE_BASIC, PERMISSIONS.STUDY_REQUESTS_CREATE_ADVANCED],
    },
    description: 'Search keywords by term and get matching results across many languages',
    notes: 'Search available keywords for study request',
    tags: ['api', 'study-requests'],
    validate: {
      query: Joi.object({
        term: Joi.string().required(),
        countryCode: Joi.string().length(2).required(),
      }),
    },
    response: {
      status: {
        200: KeywordsSearchResponse,
      },
    },
  },
  handler: async (request: AuthRequest) => {
    const term = request.query.term as string;
    const countryCode = request.query.countryCode as string;

    return await searchKeywords(term, countryCode);
  },
};

export default route;

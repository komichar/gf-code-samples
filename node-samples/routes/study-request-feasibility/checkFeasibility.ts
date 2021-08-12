import { AuthRequest } from './../../interfaces/request';
import { ServerRoute } from '@hapi/hapi';
import Joi from '@hapi/joi';
import { StudyTypeShortname } from '../../../entities/StudyType';
import {
  datesCountryListSchema,
  ioInputSchema,
  atleastOneAssetSegmentSchema,
  exactlyOneAssetSegmentSchema,
  campaignAdChooserInputSchema,
} from '../../schemas/StudyRequest';
import StudyRequestService from '../../../services/studyRequest';
import { CheckFeasibilityPayload, Feasibility } from '../../../services/studyRequest/entities';
import { PERMISSIONS } from '../../../entities/Permission';

const example = {
  reportTypeName: 'ap',
  config: {
    startDate: '2020-03-09',
    endDate: '2020-03-09',
    countryList: ['AR'],
    segment: {
      personaName: '',
      gender: ['M'],
      age: ['18_24'],
      assetLists: [
        {
          includeExclude: 'include',
          app: ['com.whatsapp', 'com.instagram'],
          site: ['facebook.com', 'google.com', 'youtube.com'],
        },
      ],
    },
  },
};

const checkFeasibilityPayloadSchema = Joi.object({
  reportTypeName: Joi.string().valid(
    StudyTypeShortname.BASIC_PERSONA,
    StudyTypeShortname.ADVANCED_PERSONA,
    StudyTypeShortname.PERFORMER_PROFILE,
    StudyTypeShortname.CREATIVE_CHOICE_REPORT
  ).required(),
  config: Joi.object().when('reportTypeName', {
    switch: [
      {
        is: StudyTypeShortname.BASIC_PERSONA,
        then: datesCountryListSchema.append({
          segment: atleastOneAssetSegmentSchema.fork('personaName', () => Joi.string().allow('').required()),
        }),
      },
      {
        is: StudyTypeShortname.ADVANCED_PERSONA,
        then: datesCountryListSchema.append({
          segment: atleastOneAssetSegmentSchema.fork('personaName', () => Joi.string().allow('').required()),
        }),
      },
      {
        is: StudyTypeShortname.PERFORMER_PROFILE,
        then: ioInputSchema.append({
          segment: exactlyOneAssetSegmentSchema.fork('personaName', () => Joi.string().allow('').required()),
        }),
      },
      {
        is: StudyTypeShortname.CREATIVE_CHOICE_REPORT,
        then: campaignAdChooserInputSchema,
      },
    ],
  }).required(),
}).label('CheckFeasibilityPayload')
  .example(example);

const feasibilityResponseSchema = Joi.object({
  feasible: Joi.boolean().required(),
  volume: Joi.number().required(),
  discriminance: Joi.number().min(0).max(100).required(),
});

const route: ServerRoute = {
  method: 'POST',
  path: '/v1/study-requests/feasibility',
  options: {
    auth: {
      scope: [PERMISSIONS.STUDY_REQUESTS_CREATE_BASIC, PERMISSIONS.STUDY_REQUESTS_CREATE_ADVANCED],
    },
    description: 'Check study request feasibility',
    notes: 'Check study request feasibility',
    tags: ['api', 'study-requests'],
    validate: {
      payload: checkFeasibilityPayloadSchema,
    },
    response: {
      status: {
        200: feasibilityResponseSchema,
      },
    },
    handler: async (request: AuthRequest): Promise<Feasibility> => {
      const params = request.payload as CheckFeasibilityPayload;
      const studyRequestService = new StudyRequestService();

      const defaultFeasibility: Feasibility = {
        feasible: false,
        discriminance: 0,
        volume: 0,
      };

      try {
        const feasibility = await studyRequestService.checkFeasibility(params);
        return feasibility;
      } catch (error) {
        if (error.message === 'Bad IO: no countries found') {
          return defaultFeasibility;
        } else {
          throw error;
        }
      }
    },
  },
};

export default route;

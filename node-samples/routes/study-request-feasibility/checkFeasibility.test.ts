import { StudyTypeShortname } from '../../../entities/StudyType';
import StudyRequestService from '../../../services/studyRequest';
import setupRequestTest from '../../../__test__/helpers/requestTest';
import { IncludeExclude, Gender, Age } from '../../../entities/StudyConfig';
import { authTokenRow, mockAuthTokenIsValid } from '../../../__test__/helpers/apiAuth';
import { CheckFeasibilityPayload } from '../../../services/studyRequest/entities';
import { ROLE_KEYS, ROLE_NAMES } from '../../../entities/Role';
import { PERMISSIONS } from '../../../entities/Permission';

jest.mock('../../../services/authToken');

jest.mock('../../../services/studyRequest');
const studyRequestServiceMock = StudyRequestService as jest.Mock<StudyRequestService>;

const { request } = setupRequestTest();

const hardAssetListMock = {
  includeExclude: IncludeExclude.INCLUDE,
  app: ['app1', 'app2', 'app3', 'app4', 'app5'],
  site: ['site1', 'site2', 'site3'],
};

const softAssetListMock = {
  includeExclude: IncludeExclude.INCLUDE,
  app: ['app1'],
  site: [] as string[],
};

const exactlyOneAssetSegmentMock = {
  personaName: 'This field can have more than 50 characters in length',
  gender: [Gender.MALE],
  age: [Age.GROUP_18_24],
  assetLists: [hardAssetListMock],
};

const atleastOneAssetSegment = {
  personaName: '',
  gender: [Gender.MALE],
  age: [Age.GROUP_18_24],
  assetLists: [hardAssetListMock, softAssetListMock],
};

const ioFeasibilityPayload: CheckFeasibilityPayload = {
  reportTypeName: StudyTypeShortname.PERFORMER_PROFILE,
  config: {
    io: '12345',
    segment: exactlyOneAssetSegmentMock,
  },
};

const datesFeasibilityPayload: CheckFeasibilityPayload = {
  reportTypeName: StudyTypeShortname.ADVANCED_PERSONA,
  config: {
    startDate: 'start-date-1523',
    endDate: 'start-date-1523',
    countryList: ['DE'],
    segment: atleastOneAssetSegment,
  },
};

const advancedStudyRequestCreatePermission = {
  role: {
    key: ROLE_KEYS.ADMIN,
    name: ROLE_NAMES.ADMIN,
    permissions: [PERMISSIONS.STUDY_REQUESTS_CREATE_ADVANCED],
  },
};

const basicStudyRequestCreatePermission = {
  role: {
    key: ROLE_KEYS.BASIC_REPORTING,
    name: ROLE_NAMES.BASIC_REPORTING,
    permissions: [PERMISSIONS.STUDY_REQUESTS_CREATE_BASIC],
  },
};

describe('POST /v1/study-requests/feasibility', () => {
  it('throws 401 error code if authorization not present in header', async () => {
    await request()
      .post('/v1/study-requests/feasibility')
      .expect(401, {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Unauthorized',
      });
  });

  it('throws 403 error code if user is not allowed to check feasibility', async () => {
    mockAuthTokenIsValid();

    await request()
      .post('/v1/study-requests/feasibility')
      .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
      .send(datesFeasibilityPayload)
      .expect(403, {
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient scope',
      });
  });

  describe('ADVANCED_PERSONA or BASIC_PERSONA', () => {

    it('throws 400 when segment.assetList is invalid - contains only soft', async () => {
      mockAuthTokenIsValid({
        role: {
          key: ROLE_KEYS.ADMIN,
          name: ROLE_NAMES.ADMIN,
          permissions: [PERMISSIONS.STUDY_REQUESTS_CREATE_ADVANCED],
        },
      });

      const invalidSegmentMock = {
        personaName: 'Persona Name',
        gender: [Gender.MALE],
        age: [Age.GROUP_18_24],
        assetLists: [softAssetListMock],
      };

      const payload: CheckFeasibilityPayload = {
        ...datesFeasibilityPayload,
        config: {
          ...datesFeasibilityPayload.config,
          segment: invalidSegmentMock,
        },
      };

      await request()
        .post('/v1/study-requests/feasibility')
        .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('throws 400 when segment.assetList is invalid - does not contain 5 apps for hard asset list', async () => {
      mockAuthTokenIsValid(advancedStudyRequestCreatePermission);

      const invalidSegmentMock = {
        personaName: 'Persona Name',
        gender: [Gender.MALE],
        age: [Age.GROUP_18_24],
        assetLists: [{
          includeExclude: IncludeExclude.INCLUDE,
          app: ['app1', 'app2', 'app3', 'app4'],
          site: ['site1'],
        }],
      };

      const payload: CheckFeasibilityPayload = {
        ...datesFeasibilityPayload,
        config: {
          ...datesFeasibilityPayload.config,
          segment: invalidSegmentMock,
        },
      };

      await request()
        .post('/v1/study-requests/feasibility')
        .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('throws 400 when segment.assetList is invalid - does not contain 1 app for soft asset list', async () => {
      mockAuthTokenIsValid(basicStudyRequestCreatePermission);

      const invalidSegmentMock = {
        personaName: 'Persona Name',
        gender: [Gender.MALE],
        age: [Age.GROUP_18_24],
        assetLists: [ 
          hardAssetListMock,
          {
            includeExclude: IncludeExclude.INCLUDE,
            app: [] as string[],
            site: ['site1'],
          }],
      };

      const payload: CheckFeasibilityPayload = {
        ...datesFeasibilityPayload,
        config: {
          ...datesFeasibilityPayload.config,
          segment: invalidSegmentMock,
        },
      };

      await request()
        .post('/v1/study-requests/feasibility')
        .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('returns feasibility when payload is dates, countryList and segment ', async () => {
      mockAuthTokenIsValid(advancedStudyRequestCreatePermission);
      const feasibility = {
        feasible: true,
        volume: 100,
        discriminance: 75,
      };
      studyRequestServiceMock.prototype.checkFeasibility.mockResolvedValueOnce(feasibility);

      await request()
        .post('/v1/study-requests/feasibility')
        .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
        .send(datesFeasibilityPayload)
        .expect(200, feasibility);
    });

  });

  describe('PERFORMER_PROFILE', () => {

    it('throws 400 when segment.assetList contains more than 1 item', async () => {
      mockAuthTokenIsValid(basicStudyRequestCreatePermission);

      const invalidSegmentMock = {
        personaName: 'Persona Name',
        gender: [Gender.MALE],
        age: [Age.GROUP_18_24],
        assetLists: [hardAssetListMock, hardAssetListMock],
      };

      const payload: CheckFeasibilityPayload = {
        ...ioFeasibilityPayload,
        config: {
          ...ioFeasibilityPayload.config,
          segment: invalidSegmentMock,
        },
      };

      await request()
        .post('/v1/study-requests/feasibility')
        .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('throws 400 when segment.assetList is invalid - does not contain 5 apps for hard asset list', async () => {
      mockAuthTokenIsValid(advancedStudyRequestCreatePermission);

      const invalidSegmentMock = {
        personaName: 'Persona Name',
        gender: [Gender.MALE],
        age: [Age.GROUP_18_24],
        assetLists: [{
          includeExclude: IncludeExclude.INCLUDE,
          app: ['app1', 'app2', 'app3', 'app4'],
          site: ['site1'],
        }],
      };

      const payload: CheckFeasibilityPayload = {
        ...ioFeasibilityPayload,
        config: {
          ...ioFeasibilityPayload.config,
          segment: invalidSegmentMock,
        },
      };

      await request()
        .post('/v1/study-requests/feasibility')
        .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('returns feasibility when config payload is io and segment', async () => {
      mockAuthTokenIsValid(basicStudyRequestCreatePermission);
      const feasibility = {
        feasible: false,
        volume: 7.6,
        discriminance: 100,
      };
      studyRequestServiceMock.prototype.checkFeasibility.mockResolvedValueOnce(feasibility);

      await request()
        .post('/v1/study-requests/feasibility')
        .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
        .send(ioFeasibilityPayload)
        .expect(200, feasibility);
    });


    it('returns default feasibility when checkFeasibility throws Bad IO error', async () => {
      mockAuthTokenIsValid(advancedStudyRequestCreatePermission);

      const defaultFeasibility = {
        feasible: false,
        volume: 0,
        discriminance: 0,
      };

      studyRequestServiceMock.prototype.checkFeasibility.mockRejectedValueOnce(new Error('Bad IO: no countries found'));

      await request()
        .post('/v1/study-requests/feasibility')
        .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
        .send(ioFeasibilityPayload)
        .expect(200, defaultFeasibility);
    });

    it('throws an error when checkFeasibility throws an unhandled error', async () => {
      mockAuthTokenIsValid(basicStudyRequestCreatePermission);

      studyRequestServiceMock.prototype.checkFeasibility.mockRejectedValueOnce(new Error('some-unhandled-error'));

      await request()
        .post('/v1/study-requests/feasibility')
        .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
        .send(ioFeasibilityPayload)
        .expect(500, {
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An internal server error occurred',
        });
    });
  });
});

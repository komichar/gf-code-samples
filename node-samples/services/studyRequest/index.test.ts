import EmailService from '../email';
import StudyRequestService from './index';
import { getUserByID, getUserByUsername } from '../../repo/users';
import { Status } from '../../entities/StudyStatus';
import setupConnectionToDB from '../../__test__/db/setup';
import { StudyTypeShortname } from '../../entities/StudyType';
import { createStudy, updateStudyByID, getStudyByID } from '../../repo/studies';
import getStatusByName from '../../repo/studyStatuses/getStatusByName';
import getTypeByShortname from '../../repo/studyTypes/getTypeByShortname';
import { createStudyConfig, updateStudyConfigByReportID } from '../../repo/studyConfigs';
import { CheckFeasibilityPayload, Feasibility } from './entities';
import {
  queryPopulationAndSegments,
  determineIOCountryListAndIndices,
  getCreativeChoiceFeasbility,
} from '../../repo/e2e/feasibility';
import { Age, Gender, IncludeExclude, Segment, SegmentV2 } from '../../entities/StudyConfig';
import { SalesforceCurrency } from '../../entities/Study';
import { addUserToStudy } from '../../repo/studyLists';
import { addBulkOfTagsToStudy } from '../../repo/tagLists';

jest.mock('../../db/connPool');
setupConnectionToDB();

jest.mock('../../repo/studies');
const createStudyMock = createStudy as jest.Mock;
const updateStudyByIDMock = updateStudyByID as jest.Mock;
const getStudyByIDMock = getStudyByID as jest.Mock;

jest.mock('../../repo/studyLists');
const addUserToStudyMock = addUserToStudy as jest.Mock;

jest.mock('../../repo/tagLists');
const addBulkOfTagsToStudyMock = addBulkOfTagsToStudy as jest.Mock;

jest.mock('../../repo/studyTypes/getTypeByShortname');
const getTypeByShortnameMock = getTypeByShortname as jest.Mock;

jest.mock('../../repo/studyStatuses/getStatusByName');
const getStatusByNameMock = getStatusByName as jest.Mock;

jest.mock('../../repo/studyConfigs');
const createStudyConfigMock = createStudyConfig as jest.Mock;
const updateStudyConfigByReportIDMock = updateStudyConfigByReportID as jest.Mock;

jest.mock('../../repo/e2e/feasibility');
const queryPopulationAndSegmentsMock = queryPopulationAndSegments as jest.Mock;
const determineIOCountryListAndIndicesMock = determineIOCountryListAndIndices as jest.Mock;
const getCreativeChoiceFeasbilityMock = getCreativeChoiceFeasbility as jest.Mock;

jest.mock('../../repo/users');
const getUserByIDMock = getUserByID as jest.Mock;
const getUserByUsernameMock = getUserByUsername as jest.Mock;

jest.mock('../email');
const emailServiceMock = EmailService as jest.Mock<EmailService>;

const createStudyRequest = {
  clientId: 1,
  reportName: 'Report Name',
  clientAgency: 'Agency',
  clientBrand: 'Brand',
  country: 'FR',
  owner: 'Tester',
  reportTypeId: 1,
  reportTypeName: StudyTypeShortname.BASIC_PERSONA,
  publishedById: 1,
  reportTypeCategoryId: 1,
  salesforceRevenue: 150000,
  salesforceCurrency: SalesforceCurrency.EUR,
  config: {
    salesEmail: '',
    io: ['12345'],
    startDate: '2020-03-09',
    endDate: '2020-03-09',
    countryList: ['AR'],
    segments: [
      {
        personaName: 'Persona Name',
        gender: ['M'],
        age: ['18_24'],
        assetLists: [
          {
            includeExclude: 'include',
            app: ['app1', 'app2'],
            site: ['site1', 'site2', 'site3'],
          },
          {
            includeExclude: 'exclude',
            app: ['app3'],
            site: [],
          },
        ],
      },
    ] as Segment[],
  },
  tagIds: [] as number[],
};

const createStudyRequestV2 = {
  clientId: 1,
  reportName: 'Report Name',
  clientAgency: 'Agency',
  clientBrand: 'Brand',
  country: 'FR',
  owner: 'Tester',
  reportTypeId: 1,
  reportTypeName: StudyTypeShortname.BASIC_PERSONA,
  publishedById: 1,
  reportTypeCategoryId: 1,
  salesforceRevenue: 150000,
  salesforceCurrency: SalesforceCurrency.EUR,
  config: {
    salesEmail: '',
    io: ['12345'],
    countryList: ['AR'],
    segments: [
      {
        personaName: 'Persona Name',
        gender: ['M'],
        age: ['18_24'],
        category: 'test category',
        keywords: [{
          word: 'chat',
          lang: 'en',
        }],
        assetLists: [
          {
            includeExclude: 'include',
            app: ['app1', 'app2'],
            site: ['site1', 'site2', 'site3'],
          },
        ],
      },
    ] as SegmentV2[],
  },
  tagIds: [] as number[],
};

const createStudyRequestMailData = {
  ...createStudyRequest,
  countryFormatted: 'France',
  reportTypeNameFormatted: 'Basic Persona',
  salesforceRevenueFormatted: '€150,000',
  config: {
    ...createStudyRequest.config,
    ioFormatted: null as string,
    campaignAdChooserFormatted: null as string,
    countryListFormatted: 'Argentina',
    endDateFormatted: '9 Mar 2020',
    startDateFormatted: '9 Mar 2020',
    segmentsFormatted: [{
      personaName: 'Persona Name',
      age: ['18_24'],
      gender: ['M'],
      assetLists: [{
        assets: ['app1', 'app2', 'site1', 'site2', 'site3'],
        includeExclude: 'include',
      }, {
        assets: ['app3'],
        includeExclude: 'exclude',
      }],
    }],
  },
};

const createStudyRequestMailDataV2 = {
  ...createStudyRequestV2,
  countryFormatted: 'France',
  reportTypeNameFormatted: 'Basic Persona',
  salesforceRevenueFormatted: '€150,000',
  config: {
    ...createStudyRequestV2.config,
    salesEmail: '',
    io: ['12345'],
    countryList: ['AR'],
    ioFormatted: null as string,
    campaignAdChooserFormatted: null as string,
    countryListFormatted: 'Argentina',
    segmentsFormatted: [{
      age: [
        '18_24',
      ],
      assetLists: [{
        assets: ['app1', 'app2', 'site1', 'site2', 'site3'],
        includeExclude: 'include',
      }],
      category: 'test category',
      gender: ['M'],
      keywords: [{
        lang: 'en',
        word: 'chat',
      }],
      personaName: 'Persona Name',
    }],
  },
};

describe('StudyRequestService', () => {

  describe('createV2()', () => {

    it('create study request v2 with config for New Advanced Persona', async () => {
      getUserByUsernameMock.mockReturnValue({ id: 1 });
      getTypeByShortnameMock.mockReturnValue({ id: 1, name: 'New Advanced Persona' });
      createStudyMock.mockReturnValue({ id: 1, uuid: '' });
      getStatusByNameMock.mockReturnValue({ id: 1 });
      createStudyConfigMock.mockReturnValue({});
      getUserByIDMock.mockReturnValueOnce({ firstName: '', lastName: '', username: 'test@test.test' });
      emailServiceMock.prototype.sendStudyRequestCreateV2.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      const uuid = await studyRequestService.createV2({
        ...createStudyRequestV2,
        reportTypeName: StudyTypeShortname.NEW_ADVANCED_PERSONA,
        country: 'FR',
        config: {
          ...createStudyRequestV2.config,
          countryList: ['test'],
        },
      });

      expect(uuid).toBeDefined();
      expect(emailServiceMock.prototype.sendStudyRequestCreateV2).toHaveBeenCalledWith(
        'test@test.test',
        'test@test.test',
        {
          ...createStudyRequestMailDataV2,
          reportTypeName: StudyTypeShortname.NEW_ADVANCED_PERSONA,
          reportTypeNameFormatted: 'New Advanced Persona',
          country: 'FR',
          countryFormatted: 'France',
          config: {
            ...createStudyRequestMailDataV2.config,
            countryList: ['test'],
            countryListFormatted: 'test',
          },
        }
      );
    });

    it('create study request v2 with config for New Performer Profiles', async () => {
      getUserByUsernameMock.mockReturnValue({ id: 1 });
      getTypeByShortnameMock.mockReturnValue({ id: 1, name: 'New Performer Profiles' });
      createStudyMock.mockReturnValue({ id: 1, uuid: '' });
      getStatusByNameMock.mockReturnValue({ id: 1 });
      createStudyConfigMock.mockReturnValue({});
      getUserByIDMock.mockReturnValueOnce({ firstName: 'Test', lastName: 'Tester', username: 'test@test.test' });
      emailServiceMock.prototype.sendStudyRequestCreateV2.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      const uuid = await studyRequestService.createV2({
        ...createStudyRequestV2,
        reportTypeName: StudyTypeShortname.NEW_PERFORMER_PROFILE,
        config: {
          ...createStudyRequestV2.config,
          io: ['12345'],
        },
      });

      expect(uuid).toBeDefined();
      expect(emailServiceMock.prototype.sendStudyRequestCreateV2).toHaveBeenCalledWith(
        'Test Tester',
        'test@test.test',
        {
          ...createStudyRequestMailDataV2,
          reportTypeName: StudyTypeShortname.NEW_PERFORMER_PROFILE,
          reportTypeNameFormatted: 'New Performer Profiles',
          config: {
            ...createStudyRequestMailDataV2.config,
            ioFormatted: '12345',
          },
        }
      );
    });

    it('create study request v2 with config for Creative Choice Report', async () => {
      getUserByUsernameMock.mockReturnValue({ id: 1 });
      getTypeByShortnameMock.mockReturnValue({ id: 1, name: 'Creative Choice Report' });
      createStudyMock.mockReturnValue({ id: 1, uuid: '' });
      getStatusByNameMock.mockReturnValue({ id: 1 });
      createStudyConfigMock.mockReturnValue({});
      getUserByIDMock.mockReturnValueOnce({ firstName: 'Test', lastName: 'Tester', username: 'test@test.test' });
      emailServiceMock.prototype.sendStudyRequestCreateV2.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      const uuid = await studyRequestService.createV2({
        ...createStudyRequestV2,
        reportTypeName: StudyTypeShortname.CREATIVE_CHOICE_REPORT,
        config: {
          campaignAdChooserId: '92312',
          salesEmail: 'sales123@email.com',
          countryList: null,
        },
      });

      expect(uuid).toBeDefined();
      expect(emailServiceMock.prototype.sendStudyRequestCreateV2).toHaveBeenCalledWith(
        'Test Tester',
        'test@test.test',
        {
          ...createStudyRequestMailDataV2,
          reportTypeName: StudyTypeShortname.CREATIVE_CHOICE_REPORT,
          reportTypeNameFormatted: 'Creative Choice Report',
          config: {
            campaignAdChooserFormatted: '92312',
            campaignAdChooserId: '92312',
            countryList: null,
            countryListFormatted: null,
            ioFormatted: null,
            salesEmail: 'sales123@email.com',
            segmentsFormatted: null,
          },
        }
      );
    });

    it('create study request v2 with config, add tags to study', async () => {
      getUserByUsernameMock.mockReturnValue({ id: 1 });
      getTypeByShortnameMock.mockReturnValue({ id: 1, name: 'Advanced Persona' });
      createStudyMock.mockReturnValue({ id: 1, uuid: '' });
      getStatusByNameMock.mockReturnValue({ id: 1 });
      createStudyConfigMock.mockReturnValue({});
      addBulkOfTagsToStudyMock.mockReturnValueOnce(true);
      getUserByIDMock.mockReturnValueOnce({ firstName: 'Test', lastName: 'Tester', username: 'test@test.test' });
      emailServiceMock.prototype.sendStudyRequestCreateV2.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      const uuid = await studyRequestService.createV2({
        ...createStudyRequestV2,
        reportTypeName: StudyTypeShortname.ADVANCED_PERSONA,
        country: 'test',
        config: createStudyRequestV2.config,
        tagIds: [1, 2],
      });
      expect(uuid).toBeDefined();
      expect(emailServiceMock.prototype.sendStudyRequestCreateV2).toHaveBeenCalledWith(
        'Test Tester',
        'test@test.test',
        {
          ...createStudyRequestMailDataV2,
          reportTypeName: StudyTypeShortname.ADVANCED_PERSONA,
          reportTypeNameFormatted: 'Advanced Persona',
          country: 'test',
          countryFormatted: 'test',
          config: createStudyRequestMailDataV2.config,
          tagIds: [1, 2],
        }
      );
    });

  });

  describe('create()', () => {
    it('create study request with config for Basic Persona', async () => {
      getUserByUsernameMock.mockReturnValue({ id: 1 });
      getTypeByShortnameMock.mockReturnValue({ id: 1, name: 'Basic Persona' });
      createStudyMock.mockReturnValue({ id: 1, uuid: '' });
      getStatusByNameMock.mockReturnValue({ id: 1 });
      createStudyConfigMock.mockReturnValue({});
      getUserByIDMock.mockReturnValueOnce({ firstName: 'Test', lastName: 'Tester', username: 'test@test.test' });
      emailServiceMock.prototype.sendStudyRequestCreate.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      const uuid = await studyRequestService.create(createStudyRequest);

      expect(uuid).toBeDefined();
      expect(emailServiceMock.prototype.sendStudyRequestCreate).toHaveBeenCalledWith(
        'Test Tester',
        'test@test.test',
        createStudyRequestMailData
      );
    });

    it('create study request with config for Advanced Persona', async () => {
      getUserByUsernameMock.mockReturnValue({ id: 1 });
      getTypeByShortnameMock.mockReturnValue({ id: 1, name: 'Advanced Persona' });
      createStudyMock.mockReturnValue({ id: 1, uuid: '' });
      getStatusByNameMock.mockReturnValue({ id: 1 });
      createStudyConfigMock.mockReturnValue({});
      getUserByIDMock.mockReturnValueOnce({ firstName: '', lastName: '', username: 'test@test.test' });
      emailServiceMock.prototype.sendStudyRequestCreate.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      const uuid = await studyRequestService.create({
        ...createStudyRequest,
        reportTypeName: StudyTypeShortname.ADVANCED_PERSONA,
        country: 'test',
        config: {
          ...createStudyRequest.config,
          countryList: ['test'],
        },
      });

      expect(uuid).toBeDefined();
      expect(emailServiceMock.prototype.sendStudyRequestCreate).toHaveBeenCalledWith(
        'test@test.test',
        'test@test.test',
        {
          ...createStudyRequestMailData,
          reportTypeName: StudyTypeShortname.ADVANCED_PERSONA,
          reportTypeNameFormatted: 'Advanced Persona',
          country: 'test',
          countryFormatted: 'test',
          config: {
            ...createStudyRequestMailData.config,
            countryList: ['test'],
            countryListFormatted: 'test',
          },
        }
      );
    });

    it('create study request with config for Performer Profiles', async () => {
      getUserByUsernameMock.mockReturnValue({ id: 1 });
      getTypeByShortnameMock.mockReturnValue({ id: 1, name: 'Performer Profiles' });
      createStudyMock.mockReturnValue({ id: 1, uuid: '' });
      getStatusByNameMock.mockReturnValue({ id: 1 });
      createStudyConfigMock.mockReturnValue({});
      getUserByIDMock.mockReturnValueOnce({ firstName: 'Test', lastName: 'Tester', username: 'test@test.test' });
      emailServiceMock.prototype.sendStudyRequestCreate.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      const uuid = await studyRequestService.create({
        ...createStudyRequest,
        reportTypeName: StudyTypeShortname.PERFORMER_PROFILE,
        config: {
          ...createStudyRequest.config,
          io: ['12345'],
        },
      });

      expect(uuid).toBeDefined();
      expect(emailServiceMock.prototype.sendStudyRequestCreate).toHaveBeenCalledWith(
        'Test Tester',
        'test@test.test',
        {
          ...createStudyRequestMailData,
          reportTypeName: StudyTypeShortname.PERFORMER_PROFILE,
          reportTypeNameFormatted: 'Performer Profiles',
          config: {
            ...createStudyRequestMailData.config,
            ioFormatted: '12345',
            startDateFormatted: null,
            endDateFormatted: null,
            countryListFormatted: null,
          },
        }
      );
    });

    it('create study request with config for Creative Choice Report', async () => {
      getUserByUsernameMock.mockReturnValue({ id: 1 });
      getTypeByShortnameMock.mockReturnValue({ id: 1, name: 'Creative Choice Report' });
      createStudyMock.mockReturnValue({ id: 1, uuid: '' });
      getStatusByNameMock.mockReturnValue({ id: 1 });
      createStudyConfigMock.mockReturnValue({});
      getUserByIDMock.mockReturnValueOnce({ firstName: 'Test', lastName: 'Tester', username: 'test@test.test' });
      emailServiceMock.prototype.sendStudyRequestCreate.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      const uuid = await studyRequestService.create({
        ...createStudyRequest,
        reportTypeName: StudyTypeShortname.CREATIVE_CHOICE_REPORT,
        config: {
          campaignAdChooserId: '92312',
          salesEmail: 'sales123@email.com',
        },
      });

      expect(uuid).toBeDefined();
      expect(emailServiceMock.prototype.sendStudyRequestCreate).toHaveBeenCalledWith(
        'Test Tester',
        'test@test.test',
        {
          ...createStudyRequestMailData,
          reportTypeName: StudyTypeShortname.PERFORMER_PROFILE,
          reportTypeNameFormatted: 'Performer Profiles',
          config: {
            ...createStudyRequestMailData.config,
            ioFormatted: '12345',
            startDateFormatted: null,
            endDateFormatted: null,
            countryListFormatted: null,
          },
        }
      );
    });

    it('create study request with config, add tags to study', async () => {
      getUserByUsernameMock.mockReturnValue({ id: 1 });
      getTypeByShortnameMock.mockReturnValue({ id: 1, name: 'Basic Persona' });
      createStudyMock.mockReturnValue({ id: 1, uuid: '' });
      getStatusByNameMock.mockReturnValue({ id: 1 });
      createStudyConfigMock.mockReturnValue({});
      addBulkOfTagsToStudyMock.mockReturnValueOnce(true);
      getUserByIDMock.mockReturnValueOnce({ firstName: 'Test', lastName: 'Tester', username: 'test@test.test' });
      emailServiceMock.prototype.sendStudyRequestCreate.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      const uuid = await studyRequestService.create({ ...createStudyRequest, tagIds: [1, 2] });

      expect(uuid).toBeDefined();
      expect(emailServiceMock.prototype.sendStudyRequestCreate).toHaveBeenCalledWith(
        'Test Tester',
        'test@test.test',
        createStudyRequestMailData
      );
    });

  });

  describe('update()', () => {
    it('updates study request status to failed and sets error message', async () => {
      getStatusByNameMock.mockReturnValue({ id: 1 });
      updateStudyConfigByReportIDMock.mockReturnValue({ id: 1 });
      getStudyByIDMock.mockReturnValue({ publishedById: 1, uuid: 'test-uuid', reportName: 'Test Report Name' });
      getUserByIDMock.mockReturnValue({ username: 'test@test.co' });
      emailServiceMock.prototype.sendStudyRequestFail.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      await studyRequestService.update({ reportId: 1, status: Status.FAILED, errorMessage: 'error message' });

      expect(emailServiceMock.prototype.sendStudyRequestFail).toHaveBeenCalledWith(
        'test@test.co',
        'test@test.co',
        'Test Report Name'
      );
    });

    it('updates study request status to published and sets tableau luid', async () => {
      getStatusByNameMock.mockReturnValue({ id: 1 });
      updateStudyConfigByReportIDMock.mockReturnValue({ id: 1 });
      updateStudyByIDMock.mockReturnValue({ id: 1, uuid: '' });
      getUserByUsernameMock.mockResolvedValueOnce({ id: 1 });
      addUserToStudyMock.mockResolvedValue({});
      getStudyByIDMock.mockReturnValue({ publishedById: 1, uuid: 'test-uuid', reportName: 'Test Report Name' });
      getUserByIDMock.mockReturnValue({ username: 'test@test.co', firstName: 'John', lastName: 'Doe' });
      emailServiceMock.prototype.sendStudyRequestSuccess.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      await studyRequestService.update({ reportId: 1, status: Status.PUBLISHED, tableauLuid: 'test-table-luid' });

      expect(emailServiceMock.prototype.sendStudyRequestSuccess).toHaveBeenCalledWith(
        'John Doe',
        'test@test.co',
        'test-uuid'
      );

    });

    it('updates study request status to published, sets tableau luid, Menu__GLOBAL exists in access list', async () => {
      getStatusByNameMock.mockReturnValue({ id: 1 });
      updateStudyConfigByReportIDMock.mockReturnValue({ id: 1 });
      updateStudyByIDMock.mockReturnValue({ id: 1, uuid: '' });
      getUserByUsernameMock.mockResolvedValueOnce({ id: 1 });
      addUserToStudyMock.mockRejectedValue(new Error('already-exists'));
      getStudyByIDMock.mockReturnValue({ publishedById: 1, uuid: 'test-uuid', reportName: 'Test Report Name' });
      getUserByIDMock.mockReturnValue({ username: 'test@test.co', firstName: 'John', lastName: 'Doe' });
      emailServiceMock.prototype.sendStudyRequestSuccess.mockResolvedValueOnce();

      const studyRequestService = new StudyRequestService();
      await studyRequestService.update({ reportId: 1, status: Status.PUBLISHED, tableauLuid: 'test-table-luid' });

      expect(emailServiceMock.prototype.sendStudyRequestSuccess).toHaveBeenCalledWith(
        'John Doe',
        'test@test.co',
        'test-uuid'
      );

    });

    it('fails to update study request status to published', async () => {
      getStatusByNameMock.mockReturnValue({ id: 1 });
      updateStudyConfigByReportIDMock.mockReturnValue({ id: 1 });
      updateStudyByIDMock.mockReturnValue({ id: 1, uuid: '' });
      getUserByUsernameMock.mockResolvedValueOnce({ id: 1 });
      addUserToStudyMock.mockRejectedValue(new Error('test-error'));
      try {
        const studyRequestService = new StudyRequestService();
        await studyRequestService.update({ reportId: 1, status: Status.PUBLISHED, tableauLuid: 'test-table-luid' });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('test-error');
      }

      expect(emailServiceMock.prototype.sendStudyRequestSuccess).toHaveBeenCalledWith(
        'John Doe',
        'test@test.co',
        'test-uuid'
      );

    });

  });

  describe('checkFeasibility()', () => {
    it('checks feasibility for PERFORMER_PROFILE segment', async () => {
      const segmentVolume = 300;
      const population = 10000;
      const indices = ['mock_index_1'];

      const studyRequestService = new StudyRequestService();
      determineIOCountryListAndIndicesMock.mockResolvedValueOnce({ countryList: ['DE'], indices });
      queryPopulationAndSegmentsMock.mockResolvedValueOnce([{ segmentVolume, population }]);

      const params: CheckFeasibilityPayload = {
        reportTypeName: StudyTypeShortname.PERFORMER_PROFILE,
        config: {
          io: 'TEST_IO',
          segment: {
            personaName: 'testpersona',
            age: [Age.GROUP_18_24],
            gender: [Gender.MALE],
            assetLists: [
              {
                includeExclude: IncludeExclude.INCLUDE,
                app: [],
                site: [],
              },
            ],
          },
        },
      };
      const feasibility = await studyRequestService.checkFeasibility(params);

      const expected: Feasibility = {
        feasible: true,
        discriminance: 100,
        volume: 100,
      };
      expect(feasibility).toEqual(expected);
    });

    it('checks feasibility for ADVANCED_PERSONA segment and given population', async () => {
      const segmentVolume = 2000;
      const population = 10000;

      const studyRequestService = new StudyRequestService();
      queryPopulationAndSegmentsMock.mockResolvedValueOnce([{ segmentVolume, population }]);

      const params: CheckFeasibilityPayload = {
        reportTypeName: StudyTypeShortname.ADVANCED_PERSONA,
        config: {
          startDate: 'start111',
          endDate: 'endDate111',
          countryList: ['DE'],
          segment: {
            personaName: 'testpersona',
            age: [Age.GROUP_18_24],
            gender: [Gender.MALE],
            assetLists: [
              {
                includeExclude: IncludeExclude.INCLUDE,
                app: [],
                site: [],
              },
            ],
          },
        },
      };
      const feasibility = await studyRequestService.checkFeasibility(params);

      const expected: Feasibility = {
        feasible: true,
        discriminance: 25,
        volume: 100,
      };
      expect(feasibility).toEqual(expected);
    });

    it('returns good feasibility for CREATIVE_CHOICE_REPORT whencapaign ad chooser id is found and true', async () => {
      const studyRequestService = new StudyRequestService();
      getCreativeChoiceFeasbilityMock.mockResolvedValueOnce(true);

      const params: CheckFeasibilityPayload = {
        reportTypeName: StudyTypeShortname.CREATIVE_CHOICE_REPORT,
        config: {
          campaignAdChooserId: '987654',
        },
      };
      const feasibility = await studyRequestService.checkFeasibility(params);

      const expected: Feasibility = {
        feasible: true,
        discriminance: 100,
        volume: 100,
      };
      expect(feasibility).toEqual(expected);
    });

    it('returns bad feasibility for CREATIVE_CHOICE_REPORT whencapaign ad chooser id is not found', async () => {
      const studyRequestService = new StudyRequestService();
      getCreativeChoiceFeasbilityMock.mockResolvedValueOnce(false);

      const params: CheckFeasibilityPayload = {
        reportTypeName: StudyTypeShortname.CREATIVE_CHOICE_REPORT,
        config: {
          campaignAdChooserId: '987654',
        },
      };
      const feasibility = await studyRequestService.checkFeasibility(params);

      const expected: Feasibility = {
        feasible: false,
        discriminance: 0,
        volume: 0,
      };
      expect(feasibility).toEqual(expected);
    });

    it('marks PERFORMER_PROFILE study request not feasible when segment volume is below the norm of 300', async () => {
      const segmentVolume = 270;
      const population = 10000;
      const indices = ['mock_index_1'];

      const studyRequestService = new StudyRequestService();
      determineIOCountryListAndIndicesMock.mockResolvedValueOnce({ countryList: ['DE'], indices });
      queryPopulationAndSegmentsMock.mockResolvedValueOnce([{ segmentVolume, population }]);

      const params: CheckFeasibilityPayload = {
        reportTypeName: StudyTypeShortname.PERFORMER_PROFILE,
        config: {
          io: 'LOW_VOLUME_IO',
          segment: {
            personaName: 'testpersona',
            age: [Age.GROUP_18_24],
            gender: [Gender.MALE],
            assetLists: [
              {
                includeExclude: IncludeExclude.INCLUDE,
                app: [],
                site: [],
              },
            ],
          },
        },
      };
      const feasibility = await studyRequestService.checkFeasibility(params);

      const expected: Feasibility = {
        feasible: false,
        discriminance: 100,
        volume: 90,
      };
      expect(feasibility).toEqual(expected);
    });

    it('marks ADVANCED_PERSONA study request not feasible when segment volume is bellow the norm of 1000', async () => {
      const segmentVolume = 990;
      const population = 10000;

      const studyRequestService = new StudyRequestService();
      queryPopulationAndSegmentsMock.mockResolvedValueOnce([{ segmentVolume, population }]);

      const params: CheckFeasibilityPayload = {
        reportTypeName: StudyTypeShortname.ADVANCED_PERSONA,
        config: {
          startDate: 'start111',
          endDate: 'endDate111',
          countryList: ['DE'],
          segment: {
            personaName: 'testpersona',
            age: [Age.GROUP_18_24],
            gender: [Gender.MALE],
            assetLists: [
              {
                includeExclude: IncludeExclude.INCLUDE,
                app: [],
                site: [],
              },
            ],
          },
        },
      };
      const feasibility = await studyRequestService.checkFeasibility(params);

      const expected: Feasibility = {
        feasible: false,
        discriminance: 75,
        volume: 99,
      };
      expect(feasibility).toEqual(expected);
    });

    it('throws an error when segmentVolume is larger than population', async () => {
      const segmentVolume = 2000;
      const population = 1000;
      const indices = ['mock_index_1'];

      const studyRequestService = new StudyRequestService();
      determineIOCountryListAndIndicesMock.mockResolvedValueOnce({ countryList: ['DE'], indices });
      queryPopulationAndSegmentsMock.mockResolvedValueOnce([{ segmentVolume, population }]);

      const params: CheckFeasibilityPayload = {
        reportTypeName: StudyTypeShortname.PERFORMER_PROFILE,
        config: {
          io: 'throwIO',
          segment: {
            personaName: 'testpersona',
            age: [Age.GROUP_18_24],
            gender: [Gender.MALE],
            assetLists: [
              {
                includeExclude: IncludeExclude.INCLUDE,
                app: [],
                site: [],
              },
            ],
          },
        },
      };
      try {
        await studyRequestService.checkFeasibility(params);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('SegmentVolume cannot be larger than population');
      }
    });

    it('throws an error when PERFORMER_PROFILE IO returns empty country list ', async () => {
      const studyRequestService = new StudyRequestService();
      determineIOCountryListAndIndicesMock.mockResolvedValueOnce({ countryList: [], indices: ['mock_index_612'] });

      const params: CheckFeasibilityPayload = {
        reportTypeName: StudyTypeShortname.PERFORMER_PROFILE,
        config: {
          io: 'TEST_IO',
          segment: {
            personaName: 'testpersona',
            age: [Age.GROUP_18_24],
            gender: [Gender.MALE],
            assetLists: [
              {
                includeExclude: IncludeExclude.INCLUDE,
                app: [],
                site: [],
              },
            ],
          },
        },
      };

      try {
        await studyRequestService.checkFeasibility(params);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Bad IO: no countries found');
      }
    });

    it('throws when called with unknown study type', async () => {
      const studyRequestService = new StudyRequestService();

      const badParams = {
        reportTypeName: 'unknown',
      };

      try {
        await studyRequestService.checkFeasibility(badParams as CheckFeasibilityPayload);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Bad implementation: unknown reportTypeName');
      }
    });

    it('handles case when population is 0', async () => {
      const segmentVolume = 300;
      const population = 0;
      const indices = ['mock_index_1'];

      const studyRequestService = new StudyRequestService();
      determineIOCountryListAndIndicesMock.mockResolvedValueOnce({ countryList: ['DE'], indices });
      queryPopulationAndSegmentsMock.mockResolvedValueOnce([{ segmentVolume, population }]);

      const params: CheckFeasibilityPayload = {
        reportTypeName: StudyTypeShortname.PERFORMER_PROFILE,
        config: {
          io: 'TEST_IO',
          segment: {
            personaName: 'testpersona',
            age: [Age.GROUP_18_24],
            gender: [Gender.MALE],
            assetLists: [
              {
                includeExclude: IncludeExclude.INCLUDE,
                app: [],
                site: [],
              },
            ],
          },
        },
      };
      const feasibility = await studyRequestService.checkFeasibility(params);

      const expected: Feasibility = {
        feasible: false,
        discriminance: 0,
        volume: 0,
      };
      expect(feasibility).toEqual(expected);
    });

  });

  describe('mapDiscriminance()', () => {
    it('returns 0 when discriminance percentage > 20', () => {
      const service = new StudyRequestService();
      const score = service.mapDiscriminance(25);
      expect(score).toBe(0);
    });

    it('returns 25 when discriminance percentage > 15 and percentage <= 20', () => {
      const service = new StudyRequestService();
      const score = service.mapDiscriminance(20);
      expect(score).toBe(25);
    });

    it('returns 50 when discriminance percentage > 10 and percentage <= 15', () => {
      const service = new StudyRequestService();
      const score = service.mapDiscriminance(15);
      expect(score).toBe(50);
    });

    it('returns 75 when discriminance percentage > 5 and percentage <= 10', () => {
      const service = new StudyRequestService();
      const score = service.mapDiscriminance(10);
      expect(score).toBe(75);
    });

    it('returns 100 when discriminance percentage >= 0 and percentage <= 5', () => {
      const service = new StudyRequestService();
      const score = service.mapDiscriminance(0);
      expect(score).toBe(100);
    });

    it('it throws when percentage < 0', () => {
      const service = new StudyRequestService();
      try {
        service.mapDiscriminance(-1);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Bad discriminance');
      }
    });
  });
});

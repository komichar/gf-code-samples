import { v4 as uuidv4 } from 'uuid';
import Study from '../../entities/Study';
import { countries } from 'countries-list';
import { QueryResult } from 'pg';
import StudyType, { StudyTypeShortname } from '../../entities/StudyType';
import CreateStudyRequestPayload, {
  UpdateStudyRequestPayload,
  Feasibility,
  CheckFeasibilityPayload,
  CreateStudyRequestPayloadV2,
} from './entities';
import { createStudy, updateStudyByID, getStudyByID } from '../../repo/studies';
import { createStudyConfig, updateStudyConfigByReportID } from '../../repo/studyConfigs';
import StudyStatus, { Status } from '../../entities/StudyStatus';
import { transaction, transactionQuery } from '../../db/connPool';
import getStatusByName from '../../repo/studyStatuses/getStatusByName';
import getTypeByShortname from '../../repo/studyTypes/getTypeByShortname';
import {
  queryPopulationAndSegments,
  determineIOCountryListAndIndices,
  determineMonthlyWildcardIndices,
  getCreativeChoiceFeasbility,
} from '../../repo/e2e/feasibility';

export enum FeasibilityVolumeNorm {
  PERSONAS = 1000,
  PERFORMER = 300,
}

export enum FeasibilityDiscriminance {
  BAD = 20,
  FIRST = 15,
  SECOND = 10,
  THIRD = 5,
  FOURTH = 0,
}
import EmailService from '../email';
import { getUserByID, getUserByUsername } from '../../repo/users';
import { addUserToStudy } from '../../repo/studyLists';
import { formatDate, formatCurrency } from '../utils';
import { addBulkOfTagsToStudy } from '../../repo/tagLists';

export default class StudyRequestService {

  public async createV2(params: CreateStudyRequestPayloadV2): Promise<string> {
    let study: Study;
    let status: StudyStatus;
    let type: StudyType;

    await transaction(async (client): Promise<QueryResult> => {
      const clientUser = await getUserByUsername('Menu__GLOBAL');
      type = await getTypeByShortname(params.reportTypeName, transactionQuery(client));

      const createStudyParams = {
        ...params,
        clientId: clientUser.id,
        reportTypeId: type.id,
        uuid: uuidv4(),
        tableauLuid: '',
      };
      study = await createStudy(createStudyParams, transactionQuery(client));
      status = await getStatusByName(Status.QUEUED, transactionQuery(client));

      const createStudyConfigParams = {
        reportId: study.id,
        statusId: status.id,
        studyType: params.reportTypeName,
        config: params.config,
      };
      await createStudyConfig(createStudyConfigParams, transactionQuery(client));
      if (params.tagIds.length) {
        await addBulkOfTagsToStudy(study.id, params.tagIds, transactionQuery(client));
      }
      return;
    });

    const countryList = Object({ ...countries, UK: countries.GB });
    const emailService = new EmailService();
    const user = await getUserByID(study.publishedById);
    const username = `${user.firstName} ${user.lastName}`.trim() || user.username;
    const segmentsFormatted = params.config.segments && params.config.segments.length
      ? params.config.segments.map((segment) => {
        return {
          ...segment,
          assetLists: segment.assetLists.map((assetList) => {
            return {
              includeExclude: assetList.includeExclude,
              assets: assetList.app.concat(assetList.site),
            };
          }),
        };
      }) : null;
    const data = {
      ...params,
      countryFormatted: countryList[params.country]?.name || params.country,
      salesforceRevenueFormatted: formatCurrency(params.salesforceCurrency, params.salesforceRevenue),
      reportTypeNameFormatted: type.name,
      config: {
        ...params.config,
        ioFormatted: params.reportTypeName === StudyTypeShortname.NEW_PERFORMER_PROFILE ? params.config.io[0] : null,
        campaignAdChooserFormatted: params.reportTypeName === StudyTypeShortname.CREATIVE_CHOICE_REPORT
          ? params.config.campaignAdChooserId : null,
        countryListFormatted: params.config.countryList ?
          (countryList[params.config.countryList[0]]?.name || params.config.countryList[0]) : null,
        segmentsFormatted,
      },
    };
    emailService.sendStudyRequestCreateV2(username, user.username, data);

    return study.uuid;
  }

  public async create(params: CreateStudyRequestPayload): Promise<string> {
    let study: Study;
    let status: StudyStatus;
    let type: StudyType;

    await transaction(async (client): Promise<QueryResult> => {
      const clientUser = await getUserByUsername('Menu__GLOBAL');
      type = await getTypeByShortname(params.reportTypeName, transactionQuery(client));

      const createStudyParams = {
        ...params,
        clientId: clientUser.id,
        reportTypeId: type.id,
        uuid: uuidv4(),
        tableauLuid: '',
      };
      study = await createStudy(createStudyParams, transactionQuery(client));
      status = await getStatusByName(Status.QUEUED, transactionQuery(client));

      const createStudyConfigParams = {
        reportId: study.id,
        statusId: status.id,
        studyType: params.reportTypeName,
        config: params.config,
      };
      await createStudyConfig(createStudyConfigParams, transactionQuery(client));
      if (params.tagIds.length) {
        await addBulkOfTagsToStudy(study.id, params.tagIds, transactionQuery(client));
      }
      return;
    });

    const countryList = Object({ ...countries, UK: countries.GB });
    const emailService = new EmailService();
    const user = await getUserByID(study.publishedById);
    const username = `${user.firstName} ${user.lastName}`.trim() || user.username;
    const hasDatesCountryContext = (params.reportTypeName === StudyTypeShortname.ADVANCED_PERSONA
      || params.reportTypeName === StudyTypeShortname.BASIC_PERSONA
      || params.reportTypeName === StudyTypeShortname.SOCIO_DEMO_PROFILE);
    const segmentsFormatted = params.config.segments && params.config.segments.length
      ? params.config.segments.map((segment) => {
        return {
          ...segment,
          assetLists: segment.assetLists.map((assetList) => {
            return {
              includeExclude: assetList.includeExclude,
              assets: assetList.app.concat(assetList.site),
            };
          }),
        };
      }) : null;
    const data = {
      ...params,
      countryFormatted: countryList[params.country]?.name || params.country,
      salesforceRevenueFormatted: formatCurrency(params.salesforceCurrency, params.salesforceRevenue),
      reportTypeNameFormatted: type.name,
      config: {
        ...params.config,
        ioFormatted: params.reportTypeName === StudyTypeShortname.PERFORMER_PROFILE ? params.config.io[0] : null,
        startDateFormatted: hasDatesCountryContext ?
          formatDate(params.config.startDate) : null,
        endDateFormatted: hasDatesCountryContext ?
          formatDate(params.config.endDate) : null,
        countryListFormatted: hasDatesCountryContext ?
          (countryList[params.config.countryList[0]]?.name || params.config.countryList[0]) : null,
        campaignAdChooserFormatted: params.reportTypeName === StudyTypeShortname.CREATIVE_CHOICE_REPORT
          ? params.config.campaignAdChooserId : null,
        segmentsFormatted,
      },
    };
    emailService.sendStudyRequestCreate(username, user.username, data);

    return study.uuid;
  }

  public async update(params: UpdateStudyRequestPayload): Promise<void> {
    await transaction(async (client): Promise<QueryResult> => {
      const status = await getStatusByName(params.status, transactionQuery(client));
      await updateStudyConfigByReportID({ ...params, statusId: status.id }, transactionQuery(client));
      if (params.status == Status.PUBLISHED) {
        await updateStudyByID(params.reportId, params.tableauLuid, new Date(), transactionQuery(client));
        const menuGlobalUser = await getUserByUsername('Menu__GLOBAL', transactionQuery(client));
        try {
          await addUserToStudy(params.reportId, menuGlobalUser.id, transactionQuery(client));
        } catch (error) {
          if (error.message !== 'already-exists') {
            throw error;
          }
        }
      }
      return;
    });

    const emailService = new EmailService();
    const study = await getStudyByID(params.reportId);
    const user = await getUserByID(study.publishedById);
    const username = user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : user.username;
    if (params.status == Status.PUBLISHED) {
      emailService.sendStudyRequestSuccess(username, user.username, study.uuid);
    } else {
      emailService.sendStudyRequestFail(username, user.username, study.reportName);
    }
    return;
  }

  public async checkFeasibility(params: CheckFeasibilityPayload): Promise<Feasibility> {
    switch (params.reportTypeName) {
      case StudyTypeShortname.PERFORMER_PROFILE: {
        const { io, segment } = params.config;
        const { countryList, indices } = await determineIOCountryListAndIndices(io);
        if (!countryList.length) {
          throw new Error('Bad IO: no countries found');
        }
        const result = await queryPopulationAndSegments(indices, countryList, [segment], io);
        const { population, segmentVolume } = result[0];

        return this.calculateSegmentFeasibility(population, segmentVolume, FeasibilityVolumeNorm.PERFORMER);
      };

      case StudyTypeShortname.ADVANCED_PERSONA:
      case StudyTypeShortname.BASIC_PERSONA: {
        const { countryList, segment, startDate, endDate } = params.config;
        const indices = determineMonthlyWildcardIndices(startDate, endDate);
        const result = await queryPopulationAndSegments(indices, countryList, [segment], null);
        const { population, segmentVolume } = result[0];

        return this.calculateSegmentFeasibility(population, segmentVolume, FeasibilityVolumeNorm.PERSONAS);
      };

      case StudyTypeShortname.CREATIVE_CHOICE_REPORT: {
        const { campaignAdChooserId } = params.config;

        const feasible = await getCreativeChoiceFeasbility(campaignAdChooserId);

        if (feasible) {
          return {
            discriminance: 100,
            volume: 100,
            feasible: true,
          };
        }
        return {
          discriminance: 0,
          volume: 0,
          feasible: false,
        };
      }
      default:
        throw new Error('Bad implementation: unknown reportTypeName');
    }
  }

  private calculateSegmentFeasibility(population: number, segmentVolume: number, norm: number): Feasibility {
    if (population === 0) {
      return {
        feasible: false,
        discriminance: 0,
        volume: 0,
      };
    }

    const discriminancePercent = 100 * segmentVolume / population;
    let normalizedSegmentVolumePercent = Math.floor(100 * segmentVolume / norm);

    if (normalizedSegmentVolumePercent > 100) {
      normalizedSegmentVolumePercent = 100;
    }

    if (discriminancePercent > 100) {
      throw new Error('SegmentVolume cannot be larger than population');
    }

    const isVolumeOk = segmentVolume >= norm;

    return {
      feasible: isVolumeOk,
      discriminance: this.mapDiscriminance(discriminancePercent),
      volume: normalizedSegmentVolumePercent,
    };
  }

  public mapDiscriminance(percentage: number): number {
    if (percentage > FeasibilityDiscriminance.BAD) {
      return 0;
    } else if (percentage > FeasibilityDiscriminance.FIRST) {
      return 25;
    } else if (percentage > FeasibilityDiscriminance.SECOND) {
      return 50;
    } else if (percentage > FeasibilityDiscriminance.THIRD) {
      return 75;
    } else if (percentage >= FeasibilityDiscriminance.FOURTH) {
      return 100;
    } else {
      throw new Error('Bad discriminance');
    }
  }

}

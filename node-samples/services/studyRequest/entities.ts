import { StudyTypeShortname } from '../../entities/StudyType';
import { Status } from '../../entities/StudyStatus';
import { Segment, SegmentV2 } from '../../entities/StudyConfig';
import { Department, SalesforceCurrency } from '../../entities/Study';

export interface Feasibility {
  feasible: boolean;
  volume: number;
  discriminance: number;
}

type IOFeasibilityPayload = {
  reportTypeName: StudyTypeShortname.PERFORMER_PROFILE;
  config: {
    io: string;
    segment: Segment;
  };
}

type CampaignAdChooserIdFeasibilityPayload = {
  reportTypeName: StudyTypeShortname.CREATIVE_CHOICE_REPORT;
  config: {
    campaignAdChooserId: string;
  };
}

type CountryListFeasibilityPayload = {
  reportTypeName: StudyTypeShortname.ADVANCED_PERSONA | StudyTypeShortname.BASIC_PERSONA;
  config: {
    startDate: string;
    endDate: string;
    countryList: string[];
    segment: Segment;
  };
}

export type CheckFeasibilityPayload =
  CountryListFeasibilityPayload |
  IOFeasibilityPayload |
  CampaignAdChooserIdFeasibilityPayload;

interface CreateStudyRequestPayload {
  reportName: string;
  clientAgency: string;
  clientBrand: string;
  country: string;
  department?: Department;
  owner: string;
  salesforceLink?: string;
  salesforceRevenue?: number;
  salesforceCurrency?: SalesforceCurrency;
  reportTypeId: number;
  reportTypeName: StudyTypeShortname;
  publishedById: number;
  config: {
    io?: string | string[];
    campaignAdChooserId?: string;
    startDate?: string;
    endDate?: string;
    countryList?: string[];
    salesEmail: string;
    segments?: Segment[];
  };
  tagIds?: number[];
}

export interface CreateStudyRequestPayloadV2 {
  reportName: string;
  clientAgency: string;
  clientBrand: string;
  country: string;
  department?: Department;
  owner: string;
  salesforceLink?: string;
  salesforceRevenue?: number;
  salesforceCurrency?: SalesforceCurrency;
  reportTypeId: number;
  reportTypeName: StudyTypeShortname;
  publishedById: number;
  config: {
    io?: string | string[];
    campaignAdChooserId?: string;
    countryList?: string[];
    salesEmail: string;
    segments?: SegmentV2[];
  };
  tagIds?: number[];
}
export interface UpdateStudyRequestPayload {
  reportId: number;
  status: Status.PUBLISHED | Status.FAILED;
  tableauLuid?: string;
  errorMessage?: string;
}

export default CreateStudyRequestPayload;

import { getReportType, getClientsWithAccess, getStudyUUID } from './selectors';

describe('getReportType', () => {
  it('returns null if study data is null', () => {
    const state = {
      study: {
        data: null,
      },
    };

    expect(getReportType(state)).toEqual(null);
  });

  it('returns reportTypeId if study data is not null', () => {
    const state = {
      study: {
        data: {
          reportTypeId: 1,
        },
      },
    };

    expect(getReportType(state)).toEqual(state.study.data.reportTypeId);
  });

  it('returns clients with access if study data is not null', () => {
    const state = {
      study: {
        data: {
          clientsWithAccess: [1],
        },
      },
    };

    expect(getClientsWithAccess(state)).toEqual(state.study.data.clientsWithAccess);
  });
});

describe('getStudyUUUID()', () => {
  it('returns null if study data is null', () => {
    const state = {
      study: {
        data: null,
      },
    };

    expect(getStudyUUID(state)).toEqual(null);
  });

  it('returns study uuid if study data is loaded', () => {
    const state = {
      study: {
        data: {
          id: 55,
          uuid: 'mock-uuid-1234',
        },
      },
    };

    expect(getStudyUUID(state)).toEqual('mock-uuid-1234');
  });
});

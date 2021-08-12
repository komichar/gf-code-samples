import { searchKeywords, Keyword } from '../../../repo/e2e/keywords';
import setupRequestTest from '../../../__test__/helpers/requestTest';
import { authTokenRow, mockAuthTokenIsValid } from '../../../__test__/helpers/apiAuth';
import { ROLE_KEYS, ROLE_NAMES } from '../../../entities/Role';
import { PERMISSIONS } from '../../../entities/Permission';

jest.mock('../../../services/authToken');

jest.mock('../../../repo/e2e/keywords');
const searchKeywodsMock = searchKeywords as jest.Mock;

const { request } = setupRequestTest();

describe('GET /v1/study-requests/keywords', () => {
  it('returns 200 with an array of keywords', async () => {
    mockAuthTokenIsValid({
      role: {
        key: ROLE_KEYS.ADMIN,
        name: ROLE_NAMES.ADMIN,
        permissions: [PERMISSIONS.STUDY_REQUESTS_CREATE_ADVANCED],
      },
    });

    const mockKeywords: Keyword[] = [
      {
        id: 'pocherevêtue_fr_id',
        value: 'pocherevêtue',
        countryCode: 'fr',
      },
    ];

    searchKeywodsMock.mockResolvedValueOnce(mockKeywords);

    await request()
      .get('/v1/study-requests/keywords?term=poch&countryCode=fr')
      .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
      .expect(200, mockKeywords);

    expect(searchKeywodsMock).toHaveBeenCalledWith('poch', 'fr');
  });

  it('throws 400 when required query params \'term\' and \'countryCode\' are missing', async () => {
    mockAuthTokenIsValid({
      role: {
        key: ROLE_KEYS.ADMIN,
        name: ROLE_NAMES.ADMIN,
        permissions: [PERMISSIONS.STUDY_REQUESTS_CREATE_ADVANCED],
      },
    });

    searchKeywodsMock.mockResolvedValueOnce([]);

    await request()
      .get('/v1/study-requests/keywords')
      .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
      .expect(400);
  });

  it('throws 403 when user does not have the permission', async () => {
    mockAuthTokenIsValid({
      role: {
        key: ROLE_KEYS.ADMIN,
        name: ROLE_NAMES.ADMIN,
        permissions: [],
      },
    });

    searchKeywodsMock.mockResolvedValueOnce([]);

    await request()
      .get('/v1/study-requests/keywords')
      .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
      .expect(403);
  });


});

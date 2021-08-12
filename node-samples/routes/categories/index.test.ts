import Category from '../../../entities/Category';
import getCategories from '../../../repo/categories/getCategories';
import setupRequestTest from '../../../__test__/helpers/requestTest';
import { authTokenRow, mockAuthTokenIsValid } from '../../../__test__/helpers/apiAuth';
import { ROLE_KEYS, ROLE_NAMES } from '../../../entities/Role';
import { PERMISSIONS } from '../../../entities/Permission';

jest.mock('../../../services/authToken');

jest.mock('../../../repo/categories/getCategories');
const getCategoriesMock = getCategories as jest.Mock;

const categoriesMock: Category[] = [
  {
    id: 1,
    name: 'first',
    reportTypeIds: [111, 222],
    subcategories: [
      {
        id: 11,
        name: 'child of one',
        reportTypeId: 111,
      },
      {
        id: 22,
        name: 'another child of one',
        reportTypeId: 222,
      },
    ],
  },
  {
    id: 2,
    name: 'second',
    reportTypeIds: [],
    subcategories: [],
  },
];

const { request } = setupRequestTest();

describe('GET /v1/categories', () => {

  it('throws 401 when auth token is missing', async () => {
    await request()
      .get('/v1/categories')
      .expect(401);
  });

  it('throws 403 if user doesn\'t have access to this endpoint', async () => {
    mockAuthTokenIsValid({
      role: {
        key: ROLE_KEYS.CLIENT,
        name: ROLE_NAMES.CLIENT,
        permissions: [],
      },
    });
    await request()
      .get('/v1/categories')
      .set('Authorization', `Bearer ${authTokenRow.accessToken}`)
      .expect(403);
  });

  it('returns 200 with categories', async () => {
    mockAuthTokenIsValid({
      role: {
        key: ROLE_KEYS.ADMIN,
        name: ROLE_NAMES.ADMIN,
        permissions: [PERMISSIONS.STUDIES_LIST_ALL],
      },
    });
    getCategoriesMock.mockResolvedValueOnce(categoriesMock);

    await request()
      .get('/v1/categories')
      .set('Authorization', 'Bearer ' + authTokenRow.accessToken)
      .expect(200, categoriesMock);
  });
});

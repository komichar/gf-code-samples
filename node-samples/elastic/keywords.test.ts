import { getLanguageCodes } from './keywords';

describe('getLanguageCodes', () => {

  it('maps a present country code US to an array containing 1 language code english', () => {
    expect(getLanguageCodes('US')).toEqual(['en']);
  });

  it('handles lowercase country code', () => {
    expect(getLanguageCodes('us')).toEqual(['en']);
  });

  it('it maps a present country code DE to an array containing 1 language code english', () => {
    expect(getLanguageCodes('DE')).toEqual(['de','en']);
  });

  it('it defaults to english language when given country code is not present in the mapping', () => {
    expect(getLanguageCodes('RS')).toEqual(['en']);
  });
});

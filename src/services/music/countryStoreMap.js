// Maps GeoJSON country names to ISO 3166-1 alpha-2 codes (used as iTunes storefront codes)
const countryToCode = {
  'United Kingdom': 'GB',
  'Belgium': 'BE',
  'Netherlands': 'NL',
  'Austria': 'AT',
  'Czechia': 'CZ',
  'Germany': 'DE',
  'New Zealand': 'NZ',
  'Australia': 'AU',
  'United States of America': 'US',
  'Canada': 'CA',
  'Brazil': 'BR',
  'South Africa': 'ZA',
  'Japan': 'JP',
  'Colombia': 'CO'
};

export function getCountryCode(countryName) {
  return countryToCode[countryName] || null;
}

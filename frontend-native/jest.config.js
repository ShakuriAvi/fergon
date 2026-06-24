/* Jest config scoped to the pure-JS lib (api/auth) so these tests run in a
   plain Node environment without the React Native / Expo preset. Component
   tests would additionally need jest-expo + @testing-library/react-native. */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/lib/**/*.test.js'],
};

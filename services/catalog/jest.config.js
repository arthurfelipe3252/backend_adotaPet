/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      isolatedModules: true,
    }],
  },
  moduleNameMapper: {
    '^@nestjs/(.*)$': '<rootDir>/node_modules/@nestjs/$1',
    '^rxjs$': '<rootDir>/node_modules/rxjs',
    '^rxjs/(.*)$': '<rootDir>/node_modules/rxjs/$1',
    '^pg$': '<rootDir>/node_modules/pg',
    '^pg/(.*)$': '<rootDir>/node_modules/pg/$1',
    '^drizzle-orm/node-postgres$': '<rootDir>/__mocks__/drizzle-orm-node-postgres.js',
    '^drizzle-orm$': '<rootDir>/node_modules/drizzle-orm',
    '^drizzle-orm/(.*)$': '<rootDir>/node_modules/drizzle-orm/$1',
    '^amqplib$': '<rootDir>/node_modules/amqplib',
    '^amqplib/(.*)$': '<rootDir>/node_modules/amqplib/$1',
    '^class-validator$': '<rootDir>/node_modules/class-validator',
    '^class-transformer$': '<rootDir>/node_modules/class-transformer',
    '^reflect-metadata$': '<rootDir>/node_modules/reflect-metadata',
    '^@shared/(.*)$': '<rootDir>/../../shared/src/$1',
    '^@catalog/(.*)$': '<rootDir>/src/modules/catalog/$1',
  },
  testEnvironment: 'node',
};

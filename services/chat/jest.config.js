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
    '^drizzle-orm$': '<rootDir>/node_modules/drizzle-orm',
    '^drizzle-orm/(.*)$': '<rootDir>/node_modules/drizzle-orm/$1',
    '^amqplib$': '<rootDir>/node_modules/amqplib',
    '^amqplib/(.*)$': '<rootDir>/node_modules/amqplib/$1',
    '^class-validator$': '<rootDir>/node_modules/class-validator',
    '^class-transformer$': '<rootDir>/node_modules/class-transformer',
    '^reflect-metadata$': '<rootDir>/node_modules/reflect-metadata',
    '^@shared/(.*)$': '<rootDir>/../../shared/src/$1',
    '^@chat/(.*)$': '<rootDir>/src/modules/chat/$1',
  },
  testEnvironment: 'node',
};

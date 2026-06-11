const drizzle = jest.fn().mockReturnValue({
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  transaction: jest.fn(),
});
module.exports = { drizzle };

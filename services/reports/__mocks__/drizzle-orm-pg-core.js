const buildCol = (name) => {
  const col = { name };
  const methods = ['notNull', 'default', 'defaultNow', 'defaultRandom', 'primaryKey', 'references'];
  methods.forEach((m) => { col[m] = () => buildCol(name); });
  return col;
};
const pgTable = (tableName, schema) => ({ tableName, ...schema });
const uuid = (name) => buildCol(name);
const text = (name) => buildCol(name);
const varchar = (name, _opts) => buildCol(name);
const timestamp = (name, _opts) => buildCol(name);
const boolean = (name) => buildCol(name);
const integer = (name) => buildCol(name);
const numeric = (name, _opts) => buildCol(name);
module.exports = { pgTable, uuid, text, varchar, timestamp, boolean, integer, numeric };

const assert = require('assert');
const { inspectPromise } = require('@makeomatic/deploy');

describe('knex plugin', function testSuite() {
  require('../config');
  const { Microfleet: Mservice, ConnectorsTypes } = require('../../src');

  let service;

  it('should be able to throw error if plugin is not included', async () => {
    service = new Mservice({ plugins: [] });
    assert(!service.knex);
  });

  it('should be able to initialize', async () => {
    service = new Mservice({
      name: 'tester',
      plugins: ['logger', 'validator', 'knex'],
      knex: {
        client: 'pg',
        connection: 'postgres://postgres@postgres:5432/postgres',
      },
    });

    assert.ok(service.knex);
  });

  it('should be able to connect', async () => {
    const [knex] = await service.connect();

    // default settings in
    const { pool } = knex.client;
    // this is from tarn (https://github.com/vincit/tarn.js)
    assert.ok(pool.numUsed() + pool.numFree() + pool.numPendingCreates() >= 1, 'not enough connections');
  });

  it('should be able to make query', async () => {
    const { knex } = service;

    const result = await knex
      .raw('SELECT datname FROM pg_database WHERE datistemplate = false;');

    assert.equal(result.rows[0].datname, 'postgres');
  });

  it('should be able to disconnect', async () => {
    await service.close();

    assert.equal(service.knex.client.pool, undefined);
  });

  it('should be able to run migrations', async () => {
    service = new Mservice({
      name: 'tester',
      plugins: ['logger', 'validator', 'knex'],
      knex: {
        client: 'pg',
        connection: 'postgres://postgres@postgres:5432/postgres',
      },
    });

    service.addConnector(
      ConnectorsTypes.migration,
      () => service.migrate('knex')
    );

    try {
      const reason = await service.connect().reflect().then(inspectPromise(false));
      // causes error because there are no migrations to execute
      assert.equal(reason.path, '/src/packages/core/migrations', reason);
    } finally {
      await service.close();
    }
  });

  after('close', () => (
    service && service.close()
  ));
});

import { Http } from '../../../../src/platform/http/client.js';
import { TestDatabase as Store } from '../../database.js';

const store = new Store(':memory:');
let resolutions = 0;
try {
  const http = new Http(store, undefined, undefined, async () => [{ address: ++resolutions === 1 ? '8.8.8.8' : '127.0.0.1', family: 4 }]);
  const response = await http.get('https://publisher.example/article', 0, 'fetch', true);
  console.log(JSON.stringify({ body: response.body, resolutions }));
} finally { store.close(); }

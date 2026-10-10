import release from './.build/release.json';
import { downloadResponse } from './release-policy.mjs';

const worker = {
  fetch(request, env) {
    if (new URL(request.url).pathname === '/api/os/download') return downloadResponse(request, release);
    return env.ASSETS.fetch(request);
  },
};
export default worker;

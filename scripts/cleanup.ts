/* Removes test data left by browser runs (Playwright CLI, e2e.ui.*@example.com) and by npm run test:e2e.
   npm run test:cleanup */
import { cleanup } from "./e2e";

cleanup()
  .then(() => { console.log("Test data removed."); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });

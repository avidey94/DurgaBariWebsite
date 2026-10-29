import * as migration_20261029_155241_initial_about from './20261029_155241_initial_about';
import * as migration_20261029_155408_account_roles from './20261029_155408_account_roles';
import * as migration_20261029_171320 from './20261029_171320';

export const migrations = [
  {
    up: migration_20261029_155241_initial_about.up,
    down: migration_20261029_155241_initial_about.down,
    name: '20261029_155241_initial_about',
  },
  {
    up: migration_20261029_155408_account_roles.up,
    down: migration_20261029_155408_account_roles.down,
    name: '20261029_155408_account_roles',
  },
  {
    up: migration_20261029_171320.up,
    down: migration_20261029_171320.down,
    name: '20261029_171320'
  },
];

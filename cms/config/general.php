<?php

use craft\config\GeneralConfig;
use craft\helpers\App;

return GeneralConfig::create()
    ->devMode(App::env('CRAFT_ENVIRONMENT') === 'dev')
    ->allowUpdates((bool) App::env('CRAFT_ALLOW_UPDATES'))
    ->allowAdminChanges((bool) App::env('CRAFT_ALLOW_ADMIN_CHANGES'))
    ->omitScriptNameInUrls()
    ->cpTrigger(App::env('CRAFT_CP_TRIGGER') ?: 'admin')
    ->defaultWeekStartDay(1)
    ->preloadSingles()
    ->maxUploadFileSize('16M')
    // Headless: no frontend templates needed (entries have no URLs)
    ->headlessMode(false);

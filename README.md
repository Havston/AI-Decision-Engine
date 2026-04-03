# AI Decision Engine

Небольшой дашборд для анализа городской ситуации (трафик/экология) + чат с AI.

## Быстрый старт (XAMPP/локально)

1. Перейдите в папку проекта.
2. Настройте ключ OpenAI одним из способов:

### Вариант A: через локальный файл (проще)

```bash
cp backend/config/config.local.example.php backend/config/config.local.php
```

Откройте `backend/config/config.local.php` и вставьте ваш ключ.

### Вариант B: через переменные окружения

```bash
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o"
```

3. Поднимите PHP-сервер из корня проекта:

```bash
php -S localhost:8000
```

4. Откройте фронтенд:

- `http://localhost:8000/frontend/index.html`

## Проверки

```bash
php -l backend/config/config.php
php -l backend/services/AIService.php
php -l backend/services/Analyzer.php
php -l backend/api/analyze.php
```

## Важно

- `backend/config/config.local.php` храните только локально и не коммитьте ключи в git.

# База данных KARO Booking

## Статус документа

Это проект целевой PostgreSQL-архитектуры коммерческой multi-tenant SaaS-платформы. На текущем этапе Supabase не подключается, SQL-миграции не создаются, а данные приложения продолжают храниться в `localStorage`.

Связанные документы:

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — ER-диаграмма и связи;
- [SECURITY_MODEL.md](./SECURITY_MODEL.md) — будущая модель Supabase Row Level Security.

## Цели

- строгая изоляция данных организаций;
- несколько филиалов внутри одной организации;
- единая модель пользователей, участников организации и сотрудников;
- безопасное планирование записей без двойного бронирования;
- поддержка рабочего графика, перерывов, выходных, отпусков и дополнительных смен;
- сохранение исторических снимков, платежей, уведомлений и аудита;
- возможность масштабирования до нескольких тысяч организаций.

## Основные решения

| Область | Решение |
|---|---|
| Идентификаторы | `uuid`, в будущих миграциях — `DEFAULT gen_random_uuid()` |
| Multi-tenancy | Каждая tenant-owned таблица содержит `organization_id`; связи защищаются составными FK `(organization_id, entity_id)` |
| Статусы и роли | `text` + `CHECK`, а не PostgreSQL enum: значения проще расширять безопасными миграциями |
| Деньги | `bigint` в минимальных денежных единицах, без `real`/`double precision` |
| Момент времени | `timestamptz`, хранение в UTC; отображение по IANA timezone филиала/организации |
| Локальное время графика | `date`, `smallint` weekday и `time without time zone` |
| Удаление | Архивирование и деактивация; hard delete исторических сущностей запрещён обычным приложением |
| Двойная запись | PostgreSQL GiST exclusion constraint по диапазону времени сотрудника |
| Аудит | Append-only `audit_logs` и отдельная история статусов записей |

Предполагаемые расширения PostgreSQL: `pgcrypto` для UUID, `btree_gist` для exclusion constraints и опционально `citext` для email/slug. Они будут включены только на этапе SQL-миграций.

## Общие соглашения

### Tenant ownership

Глобальными являются только `users` и справочная строка самой `organizations`. Все остальные бизнес-данные получают `organization_id NOT NULL`.

У tenant-owned сущностей с одиночным `id` дополнительно создаётся `UNIQUE (organization_id, id)`. Ссылки из других tenant-owned таблиц используют составной внешний ключ, например:

```sql
FOREIGN KEY (organization_id, staff_id)
  REFERENCES staff (organization_id, id)
```

Так база данных не позволит связать запись организации A с сотрудником организации B даже при ошибке серверного кода или RLS-политики.

### Обязательность и даты изменения

- `created_at timestamptz NOT NULL DEFAULT now()` применяется ко всем изменяемым сущностям.
- `updated_at timestamptz NOT NULL DEFAULT now()` применяется там, где строка редактируется.
- В будущих миграциях `updated_at` обновляется единым `BEFORE UPDATE` trigger.
- Append-only таблицы `appointment_status_history` и `audit_logs` намеренно не имеют `updated_at`.

### Нормализация телефонов и email

- Телефоны принимаются в исходном виде для отображения и отдельно нормализуются в E.164-подобное значение.
- Email сравнивается без учёта регистра через `citext` либо уникальный индекс по `lower(email)`.
- Нормализация выполняется только доверенным серверным кодом; клиентское значение не считается проверенным.

## Таблицы

Техническое задание перечисляет 18 физических таблиц. Термин `schedules` в описании ER-диаграммы обозначает группу из пяти таблиц графика, а не отдельную девятнадцатую таблицу. Отдельная `appointment_items` понадобится в будущем, если одна запись должна включать несколько услуг.

### `organizations`

Корневая tenant-сущность компании.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Идентификатор организации |
| `name` | `text` | NOT NULL | Отображаемое название |
| `slug` | `citext` | NOT NULL | Уникальный URL-slug |
| `phone` | `text` | NULL | Основной телефон |
| `email` | `citext` | NULL | Основной email |
| `timezone` | `text` | NOT NULL, default `Asia/Almaty` | IANA timezone по умолчанию |
| `currency` | `char(3)` | NOT NULL, default `KZT` | ISO 4217 |
| `country` | `text` | NOT NULL | Страна |
| `city` | `text` | NULL | Город головного офиса |
| `address` | `text` | NULL | Адрес |
| `logo_url` | `text` | NULL | URL логотипа |
| `status` | `text` | NOT NULL, default `active` | `active`, `suspended`, `archived` |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

Ограничения и индексы:

- PK: `id`.
- UNIQUE: `slug`.
- CHECK: slug соответствует `^[a-z0-9]+(?:-[a-z0-9]+)*$`; status входит в допустимый список; currency — три заглавные буквы.
- CHECK: минимум один канал связи — `phone IS NOT NULL OR email IS NOT NULL`.
- Индексы: `(status)`, опционально `lower(name)` для back-office поиска.
- Удаление: обычный hard delete запрещён; компания переводится в `archived`, после чего записи и фоновые задания блокируются. Физическое удаление возможно только отдельной административной процедурой с retention-проверками.

### `locations`

Филиалы организации. Одна организация может иметь несколько филиалов.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Филиал |
| `organization_id` | `uuid` | NOT NULL | Владелец данных |
| `name` | `text` | NOT NULL | Название филиала |
| `phone` | `text` | NULL | Телефон филиала |
| `city` | `text` | NULL | Город |
| `address` | `text` | NULL | Адрес |
| `timezone` | `text` | NOT NULL | IANA timezone, может отличаться от организации |
| `active` | `boolean` | NOT NULL, default `true` | Доступность филиала |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

- PK: `id`; tenant key: `UNIQUE (organization_id, id)`.
- FK: `organization_id -> organizations.id ON DELETE RESTRICT`.
- CHECK: непустые `name` и `timezone`.
- Индексы: `(organization_id, active)`, `(organization_id, city)`.
- Удаление: `active = false`; hard delete запрещается при наличии сотрудников, услуг или записей.

### `users`

Глобальный профиль пользователя платформы. Пароль не хранится. В будущем `users.id` должен совпадать с `auth.users.id` Supabase Auth.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | ID из Supabase Auth |
| `email` | `citext` | NULL | Email |
| `phone` | `text` | NULL | Телефон |
| `full_name` | `text` | NOT NULL | Имя пользователя |
| `avatar_url` | `text` | NULL | Аватар |
| `created_at` | `timestamptz` | NOT NULL | Создание профиля |
| `updated_at` | `timestamptz` | NOT NULL | Изменение профиля |

- PK: `id`; будущий FK: `id -> auth.users.id ON DELETE CASCADE`.
- CHECK: `email IS NOT NULL OR phone IS NOT NULL`.
- Уникальные partial indexes: `lower(email)` при ненулевом email; нормализованный phone при ненулевом phone.
- Удаление: членства удаляются, ссылки автора в истории становятся NULL, сотрудник сохраняется с `user_id = NULL`; бизнес-история не удаляется.

### `organization_members`

Связывает пользователя с организацией и задаёт роль. Один пользователь может состоять в нескольких организациях.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Членство |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `user_id` | `uuid` | NOT NULL | Пользователь |
| `role` | `text` | NOT NULL | `owner`, `admin`, `staff`, `viewer` |
| `staff_id` | `uuid` | NULL | Связанный профиль сотрудника |
| `active` | `boolean` | NOT NULL, default `true` | Активность доступа |
| `created_at` | `timestamptz` | NOT NULL | Дата вступления |
| `updated_at` | `timestamptz` | NOT NULL | Изменение роли/активности |

- PK: `id`.
- FK: `organization_id -> organizations.id ON DELETE RESTRICT`; `user_id -> users.id ON DELETE CASCADE`; `(organization_id, staff_id) -> staff(organization_id, id) ON DELETE SET NULL`.
- UNIQUE: `(organization_id, user_id)`; partial unique `(organization_id, staff_id)` при `staff_id IS NOT NULL`.
- CHECK: допустимая роль; для роли `staff` поле `staff_id` обязательно. Owner/admin могут иметь `staff_id`, если также оказывают услуги.
- Индексы: `(user_id, active)`, `(organization_id, role, active)`.
- Удаление: членство можно удалить физически после записи события в audit log; предпочтительно сначала `active = false`.

### `staff`

Профиль сотрудника, участвующего в расписании и услугах.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Сотрудник |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `location_id` | `uuid` | NOT NULL | Основной филиал |
| `user_id` | `uuid` | NULL | Связанный пользователь |
| `name` | `text` | NOT NULL | Имя |
| `position` | `text` | NOT NULL | Должность |
| `phone` | `text` | NULL | Телефон |
| `email` | `citext` | NULL | Email |
| `color` | `varchar(7)` | NOT NULL | HEX-цвет календаря |
| `photo_url` | `text` | NULL | Фотография |
| `active` | `boolean` | NOT NULL, default `true` | Может ли сотрудник работать |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

- PK: `id`; tenant keys: `(organization_id, id)` и `(organization_id, location_id, id)`.
- FK: `(organization_id, location_id) -> locations(organization_id, id) ON DELETE RESTRICT`; `user_id -> users.id ON DELETE SET NULL`.
- Partial UNIQUE: `(organization_id, user_id)` при `user_id IS NOT NULL`.
- CHECK: `color ~ '^#[0-9A-Fa-f]{6}$'`; имя и должность непустые.
- Индексы: `(organization_id, location_id, active)`, `(organization_id, lower(name))`.
- Удаление: при существующих appointments запрещено; используется `active = false`. Снимки имени в appointments сохраняют историю.

### `services`

Каталог услуг. `location_id = NULL` означает услугу, доступную на уровне всей организации.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Услуга |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `location_id` | `uuid` | NULL | Филиал или глобальная услуга |
| `name` | `text` | NOT NULL | Название |
| `description` | `text` | NULL | Описание |
| `duration_minutes` | `integer` | NOT NULL | Длительность |
| `buffer_before_minutes` | `integer` | NOT NULL, default `0` | Буфер до |
| `buffer_after_minutes` | `integer` | NOT NULL, default `0` | Буфер после |
| `price` | `bigint` | NOT NULL | Цена в минимальных единицах |
| `active` | `boolean` | NOT NULL, default `true` | Активность |
| `online_booking_enabled` | `boolean` | NOT NULL, default `true` | Доступность на сайте |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

- PK: `id`; tenant key: `UNIQUE (organization_id, id)`.
- FK: `(organization_id, location_id) -> locations(organization_id, id) ON DELETE RESTRICT`.
- CHECK: `duration_minutes > 0`, оба buffer `>= 0`, `price >= 0`, непустое имя.
- Индексы: `(organization_id, active, online_booking_enabled)`, `(organization_id, location_id)`, `(organization_id, lower(name))`. Одинаковые названия не запрещаются constraint-ом: бизнес может намеренно иметь варианты одной услуги.
- Удаление: `active = false`; hard delete запрещён при наличии appointments. Snapshot-поля сохраняют историческое название и цену записи.

### `staff_services`

Many-to-many связь сотрудников с услугами и персональными условиями.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `organization_id` | `uuid` | NOT NULL | Tenant |
| `staff_id` | `uuid` | NOT NULL | Сотрудник |
| `service_id` | `uuid` | NOT NULL | Услуга |
| `custom_price` | `bigint` | NULL | Индивидуальная цена |
| `custom_duration_minutes` | `integer` | NULL | Индивидуальная длительность |
| `active` | `boolean` | NOT NULL, default `true` | Активность связи |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

- Составной PK: `(organization_id, staff_id, service_id)`.
- FK: `(organization_id, staff_id) -> staff`; `(organization_id, service_id) -> services`; оба `ON DELETE CASCADE` только для разрешённого hard delete неиспользуемых справочников.
- CHECK: custom price `>= 0`; custom duration `> 0`.
- Индексы: `(organization_id, service_id, active)` и `(organization_id, staff_id, active)`.

### `clients`

Клиентская карточка внутри организации.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Клиент |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `full_name` | `text` | NOT NULL | Имя |
| `phone` | `text` | NOT NULL | Исходный телефон |
| `phone_normalized` | `text` | NOT NULL | Нормализованный телефон для поиска и unique |
| `whatsapp_phone` | `text` | NULL | WhatsApp |
| `email` | `citext` | NULL | Email |
| `birth_date` | `date` | NULL | Дата рождения |
| `gender` | `text` | NULL | `female`, `male`, `other`, `unspecified` |
| `notes` | `text` | NULL | Общие заметки |
| `allergies` | `text` | NULL | Медицински чувствительная заметка |
| `source` | `text` | NOT NULL, default `admin` | Источник клиента |
| `photo_url` | `text` | NULL | Фото |
| `marketing_consent` | `boolean` | NOT NULL, default `false` | Согласие на маркетинг |
| `archived_at` | `timestamptz` | NULL | Soft delete |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

- PK: `id`; tenant key: `(organization_id, id)`.
- FK: `organization_id -> organizations.id ON DELETE RESTRICT`.
- UNIQUE: `(organization_id, phone_normalized)` — защита от случайных дублей по телефону внутри одной организации.
- CHECK: непустые full name и normalized phone; birth date не в будущем; gender/source из разрешённых списков.
- Индексы: `(organization_id, lower(full_name))`, `(organization_id, email) WHERE email IS NOT NULL`, `(organization_id, archived_at)`.
- Удаление: `archived_at` вместо hard delete. При запросе на удаление персональных данных карточка анонимизируется отдельной серверной процедурой, но финансовая история и appointment snapshots сохраняются по retention-политике.

### `appointments`

Центральная запись клиента на услугу.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Запись |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `location_id` | `uuid` | NOT NULL | Филиал |
| `client_id` | `uuid` | NOT NULL | Клиент |
| `staff_id` | `uuid` | NOT NULL | Сотрудник |
| `service_id` | `uuid` | NOT NULL | Услуга |
| `start_at` | `timestamptz` | NOT NULL | Начало |
| `end_at` | `timestamptz` | NOT NULL | Окончание |
| `status` | `text` | NOT NULL, default `new` | Статус |
| `price` | `bigint` | NOT NULL | Зафиксированная цена |
| `currency` | `char(3)` | NOT NULL | Валюта цены на момент записи |
| `client_name_snapshot` | `text` | NOT NULL | Имя на момент записи |
| `client_phone_snapshot` | `text` | NOT NULL | Телефон на момент записи |
| `service_name_snapshot` | `text` | NOT NULL | Услуга на момент записи |
| `staff_name_snapshot` | `text` | NOT NULL | Сотрудник на момент записи |
| `comment` | `text` | NULL | Комментарий |
| `created_by_user_id` | `uuid` | NULL | Кто создал |
| `source` | `text` | NOT NULL | Канал создания |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |
| `cancelled_at` | `timestamptz` | NULL | Отмена |
| `completed_at` | `timestamptz` | NULL | Завершение |

- PK: `id`; tenant key: `(organization_id, id)`.
- Tenant-safe FK: location, client, staff и service через `(organization_id, *_id)`; `created_by_user_id -> users.id ON DELETE SET NULL`.
- Для staff дополнительно проверяется соответствие филиалу. Для organization-wide service (`location_id IS NULL`) соответствие филиалу проверяет server function/trigger.
- CHECK: `start_at < end_at`; `price >= 0`; currency соответствует `^[A-Z]{3}$`.
- CHECK status: `new`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`.
- CHECK source: `website`, `admin`, `whatsapp`, `phone`, `import`, `api`.
- CHECK: cancelled требует `cancelled_at`; completed требует `completed_at`.
- Индексы: `(organization_id, start_at)`, `(organization_id, location_id, start_at)`, `(organization_id, staff_id, start_at)`, `(organization_id, client_id, start_at DESC)`, partial `(organization_id, status, start_at) WHERE status NOT IN ('completed','cancelled','no_show')`.
- Удаление: не удаляется; отмена выполняется статусом `cancelled`. FK на staff/service/client используют `RESTRICT`.

#### Предотвращение пересечений

Надёжная защита выполняется в PostgreSQL, а не проверкой «сначала SELECT, затем INSERT», которая подвержена race condition:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
ADD CONSTRAINT appointments_no_staff_overlap
EXCLUDE USING gist (
  organization_id WITH =,
  staff_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (status <> 'cancelled');
```

Диапазон `[)` разрешает следующую запись ровно в момент окончания предыдущей. Отменённые записи исключены partial predicate и не блокируют время. Повторная активация отменённой записи также проходит constraint и может быть отклонена при конфликте.

Буферы услуги проверяются доверенной серверной функцией в одной транзакции. Если потребуется гарантировать их исключительно constraint-ом, в appointments добавляются snapshot-поля `blocked_start_at`/`blocked_end_at`, и exclusion constraint строится по ним.

### `appointment_status_history`

Неизменяемая история переходов статуса.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Событие |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `appointment_id` | `uuid` | NOT NULL | Запись |
| `old_status` | `text` | NULL | Предыдущий статус; NULL при создании |
| `new_status` | `text` | NOT NULL | Новый статус |
| `changed_by_user_id` | `uuid` | NULL | Автор |
| `comment` | `text` | NULL | Причина |
| `created_at` | `timestamptz` | NOT NULL | Время изменения |

- PK: `id`; FK `(organization_id, appointment_id) -> appointments ON DELETE RESTRICT`; user `ON DELETE SET NULL`.
- CHECK old/new по списку статусов и `old_status IS DISTINCT FROM new_status`.
- Индексы: `(organization_id, appointment_id, created_at)`, `(organization_id, created_at DESC)`.
- INSERT создаётся серверным trigger/function при каждом переходе; UPDATE/DELETE запрещены.

### `staff_weekly_schedules`

Повторяющиеся рабочие интервалы. Несколько строк на weekday поддерживают разделённые смены.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Интервал |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `staff_id` | `uuid` | NOT NULL | Сотрудник |
| `weekday` | `smallint` | NOT NULL | ISO: 1 — понедельник, 7 — воскресенье |
| `start_time` | `time` | NOT NULL | Начало локальной смены |
| `end_time` | `time` | NOT NULL | Конец |
| `active` | `boolean` | NOT NULL, default `true` | Активность |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

- FK `(organization_id, staff_id) -> staff ON DELETE CASCADE`.
- UNIQUE `(organization_id, staff_id, weekday, start_time, end_time)`.
- CHECK `weekday BETWEEN 1 AND 7`, `start_time < end_time`; overnight-смена моделируется двумя интервалами по разным датам.
- Индекс `(organization_id, staff_id, weekday, active)`.
- На этапе миграций рекомендуется exclusion constraint по staff + weekday + диапазону секунд, чтобы активные интервалы не пересекались.

### `staff_schedule_breaks`

Разовый (`date`) или еженедельный (`weekday`) перерыв.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Перерыв |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `staff_id` | `uuid` | NOT NULL | Сотрудник |
| `date` | `date` | NULL | Конкретная дата |
| `weekday` | `smallint` | NULL | Еженедельный день |
| `start_time` | `time` | NOT NULL | Начало |
| `end_time` | `time` | NOT NULL | Конец |
| `title` | `text` | NOT NULL | Например, «Обед» |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

- FK staff `ON DELETE CASCADE`.
- CHECK: ровно одно из `date`/`weekday` заполнено; weekday 1–7; `start_time < end_time`.
- Unique index с `NULLS NOT DISTINCT` по `(organization_id, staff_id, date, weekday, start_time, end_time)`.
- Индексы: `(organization_id, staff_id, date)`, `(organization_id, staff_id, weekday)`.

### `staff_days_off`

Индивидуальный выходной на конкретную дату.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Выходной |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `staff_id` | `uuid` | NOT NULL | Сотрудник |
| `date` | `date` | NOT NULL | Дата |
| `reason` | `text` | NULL | Причина |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

- FK staff `ON DELETE CASCADE`; UNIQUE `(organization_id, staff_id, date)`.
- Индекс `(organization_id, date, staff_id)`.

### `staff_vacations`

Диапазоны отпуска.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Отпуск |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `staff_id` | `uuid` | NOT NULL | Сотрудник |
| `start_date` | `date` | NOT NULL | Начало включительно |
| `end_date` | `date` | NOT NULL | Конец включительно |
| `reason` | `text` | NULL | Причина |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

- FK staff `ON DELETE CASCADE`; CHECK `start_date <= end_date`.
- Индекс GiST по `daterange(start_date, end_date, '[]')` вместе с organization/staff; можно сделать exclusion для запрета пересекающихся отпусков.

### `staff_extra_intervals`

Дополнительное рабочее окно вне недельного графика, включая работу в выходной.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Интервал |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `staff_id` | `uuid` | NOT NULL | Сотрудник |
| `date` | `date` | NOT NULL | Дата |
| `start_time` | `time` | NOT NULL | Начало |
| `end_time` | `time` | NOT NULL | Конец |
| `title` | `text` | NULL | Описание |
| `created_at` | `timestamptz` | NOT NULL | Создание |
| `updated_at` | `timestamptz` | NOT NULL | Изменение |

- FK staff `ON DELETE CASCADE`.
- CHECK `start_time < end_time`; UNIQUE `(organization_id, staff_id, date, start_time, end_time)`.
- Индекс `(organization_id, staff_id, date)`.

При расчёте доступности принят следующий приоритет: отпуск полностью закрывает дату; индивидуальный выходной удаляет базовый недельный график; explicit extra interval может открыть ограниченное окно даже в выходной; перерывы вычитаются из любого рабочего окна; затем проверяются appointments и прошедшее время.

### `payments`

Финансовые операции по записи; одна запись может иметь несколько платежей/возвратов.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Платёж |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `appointment_id` | `uuid` | NOT NULL | Запись |
| `amount` | `bigint` | NOT NULL | Положительная сумма в минимальных единицах |
| `currency` | `char(3)` | NOT NULL | ISO 4217 |
| `method` | `text` | NOT NULL | `cash`, `card`, `kaspi`, `bank_transfer`, `online` |
| `status` | `text` | NOT NULL, default `pending` | `pending`, `paid`, `refunded`, `cancelled` |
| `external_reference` | `text` | NULL | ID внешнего провайдера |
| `paid_at` | `timestamptz` | NULL | Время оплаты |
| `created_at` | `timestamptz` | NOT NULL | Создание |

- FK `(organization_id, appointment_id) -> appointments ON DELETE RESTRICT`.
- CHECK `amount > 0`, currency uppercase, method/status допустимы; paid/refunded требуют `paid_at`.
- Partial UNIQUE `(organization_id, method, external_reference)` при ненулевой ссылке.
- Индексы: `(organization_id, appointment_id)`, `(organization_id, status, created_at)`, `(organization_id, paid_at)`.
- UPDATE разрешён только для контролируемого перехода статуса; DELETE запрещён, возврат — отдельная операция/статус.

### `notifications`

Очередь и история клиентских уведомлений.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Уведомление |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `appointment_id` | `uuid` | NULL | Связанная запись |
| `client_id` | `uuid` | NULL | Получатель |
| `channel` | `text` | NOT NULL | `whatsapp`, `sms`, `email`, `push` |
| `template` | `text` | NOT NULL | Ключ шаблона |
| `idempotency_key` | `text` | NULL | Защита от повторной постановки в очередь |
| `status` | `text` | NOT NULL, default `pending` | `pending`, `scheduled`, `sending`, `sent`, `failed`, `cancelled` |
| `scheduled_at` | `timestamptz` | NOT NULL | Плановое время |
| `sent_at` | `timestamptz` | NULL | Отправка |
| `error_message` | `text` | NULL | Ошибка провайдера |
| `created_at` | `timestamptz` | NOT NULL | Создание |

- Tenant-safe FK appointment/client `ON DELETE RESTRICT`; исторические записи не удаляются.
- CHECK: appointment или client должен быть задан; допустимые channel/status; `sent` требует `sent_at`.
- Partial UNIQUE: `(organization_id, channel, idempotency_key)` при ненулевом ключе.
- Индексы: partial `(status, scheduled_at) WHERE status IN ('pending','scheduled')` для worker; `(organization_id, appointment_id)`; `(organization_id, client_id, created_at DESC)`.
- Создание/отправка выполняются серверным worker; браузер не получает ключи WhatsApp/SMS/email-провайдеров.

### `audit_logs`

Append-only журнал критических операций.

| Поле | Тип | Null / default | Назначение |
|---|---|---|---|
| `id` | `uuid` | PK, NOT NULL | Событие |
| `organization_id` | `uuid` | NOT NULL | Организация |
| `user_id` | `uuid` | NULL | Пользователь или системная операция |
| `entity_type` | `text` | NOT NULL | Тип сущности |
| `entity_id` | `uuid` | NOT NULL | ID сущности |
| `action` | `text` | NOT NULL | Действие |
| `old_data` | `jsonb` | NULL | Безопасный снимок до |
| `new_data` | `jsonb` | NULL | Безопасный снимок после |
| `ip_address` | `inet` | NULL | IP запроса |
| `created_at` | `timestamptz` | NOT NULL | Время события |

- PK: `id`; FK organization `ON DELETE RESTRICT`, user `ON DELETE SET NULL`.
- CHECK: непустые `entity_type` и `action`; минимум один из old/new data может быть задан для mutation-событий.
- Индексы: `(organization_id, entity_type, entity_id, created_at DESC)`, `(organization_id, user_id, created_at DESC)`, BRIN `(created_at)` при большом объёме.
- UPDATE/DELETE запрещены прикладным ролям. Секреты, пароли, токены, полные платёжные реквизиты и лишние медицинские данные в JSONB не записываются.

## Стратегия soft delete и жизненный цикл

- Организация: `status = archived`; вход, создание записей и фоновые задания блокируются.
- Филиал, сотрудник, услуга, membership: `active = false`.
- Клиент: `archived_at`, затем при законном запросе — контролируемая анонимизация PII.
- Запись: `status = cancelled`; физическое удаление не используется.
- Платёж, status history, notification history, audit log: только retention/архивная процедура, недоступная обычным ролям.

Hard delete разрешается только серверной административной процедуре после проверки зависимостей, retention и audit trail.

## Время и часовые пояса

- `appointments.start_at/end_at`, платежи, уведомления и audit хранятся как `timestamptz` в UTC.
- Пользователь выбирает локальные дату/время в timezone филиала; server конвертирует их в UTC.
- Недельный график хранится в локальном `time` и интерпретируется в timezone филиала на конкретную дату.
- Нельзя хранить UTC-offset вроде `+05:00` вместо IANA name: offset не описывает исторические/будущие изменения часового пояса.
- При переносе сотрудника между филиалами будущие интервалы пересчитываются явно; исторические appointments не меняются.

## Денежные значения

`price`, `custom_price`, `appointments.price` и `payments.amount` используют `bigint` минимальных денежных единиц. Это исключает ошибки floating point и подходит для валют с 0, 2 или 3 знаками. Количество знаков определяется ISO 4217 на уровне денежного сервиса; например, для KZT значение хранится в тиынах согласно принятой продуктовой политике. Currency фиксируется в appointment и payment, а базовая currency — в организации.

## Snapshot-поля appointments

Snapshot-поля обязательны, потому что имя клиента, телефона, услуги, сотрудника и цена могут измениться после записи. UI исторической записи и финансовые документы используют snapshots, а текущие карточки — FK. Это позволяет деактивировать/переименовать сущности без переписывания истории.

## Удаление сотрудника и услуги

- Сотрудника с appointments нельзя удалить: `active = false`, будущие записи переносятся/отменяются, график закрывается.
- Услугу с appointments нельзя удалить: `active = false`, online booking выключается.
- FK используют `RESTRICT`; snapshot-поля продолжают отображать исторические значения.
- `staff_services` можно деактивировать независимо от истории.

## Архивирование организаций

Архивирование выполняется транзакционной server-side операцией:

1. status организации меняется на `archived`;
2. новые сессии и mutation-запросы отклоняются;
3. pending notifications отменяются;
4. публичная booking-страница закрывается;
5. событие фиксируется в audit logs;
6. данные сохраняются до окончания retention-периода.

## Масштабирование

- Все горячие запросы начинаются с `organization_id`; это первый столбец tenant-индексов.
- Calendar использует bounded date range и keyset pagination, а не загрузку всей истории.
- Connection pooling Supabase применяется с первого production-релиза.
- Уведомления отправляются асинхронными workers с `FOR UPDATE SKIP LOCKED`.
- Audit logs и notifications после реального роста можно partition по `created_at`; appointments — по времени только после измерений, чтобы не усложнить exclusion constraint преждевременно.
- Старые audit/notification payloads можно переносить в дешёвое архивное хранилище по retention policy.
- Read replicas, materialized views и аналитическое хранилище добавляются отдельно; OLTP-схема не должна обслуживать тяжёлую аналитику.
- Все запросы проверяются через `EXPLAIN (ANALYZE, BUFFERS)` на production-подобном объёме и проходят cross-tenant security tests.

## Порядок будущей реализации

1. Создать Supabase-проект и включить необходимые расширения.
2. Разбить схему на версионируемые SQL-миграции.
3. Создать таблицы, tenant-safe FK, CHECK и индексы.
4. Добавить updated-at/status-history/audit triggers.
5. Включить RLS для каждой таблицы и написать тесты отрицательного доступа.
6. Подключить Supabase Auth и membership selection.
7. Реализовать server-side booking transaction с exclusion constraint.
8. Перенести данные из `localStorage` контролируемым импортом.
9. Провести нагрузочное, concurrency и production security testing.

## Спорные решения и принятые варианты

- **18 или 19 таблиц:** в задании фактически перечислено 18; `schedules` — группа. Новая таблица не добавляется без продуктовой необходимости.
- **Одна или несколько услуг в записи:** текущая модель фиксирует одну `service_id`; multi-service booking потребует `appointment_items` и пересмотра snapshots/цены.
- **Телефон клиента:** строгий unique по normalized phone хорошо предотвращает дубли, но семейный общий номер потребует явного override/merge-сценария либо перехода на предупреждение вместо hard constraint.
- **Один филиал сотрудника:** `staff.location_id` задаёт основной филиал; работа в нескольких филиалах потребует `staff_locations`.
- **Дополнительное окно и выходной:** explicit extra interval открывает окно в day off, но не отменяет vacation. Это соответствует назначению дополнительной смены.
- **Буферы записи:** текущий exclusion constraint защищает `start_at/end_at`; для жёсткого блокирования buffers нужны snapshot-границы занятости.
- **Удаление записи:** пользовательское «удалить» реализуется отменой с audit trail, а физический SQL DELETE не является штатной операцией.
- **Возвраты:** статус `refunded` достаточен для полного возврата MVP; частичные возвраты потребуют отдельной ledger-модели.
- **Ночные смены:** интервал через полночь разбивается на две строки; это проще для проверок timezone и доступности.
- **Исторические таблицы без `updated_at`:** status history и audit logs append-only, поэтому изменение строк запрещено по дизайну.

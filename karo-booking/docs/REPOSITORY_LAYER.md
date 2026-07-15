# Repository Layer

## Назначение

Repository Layer отделяет интерфейс и прикладную логику KARO Booking от способа хранения данных. Компоненты работают с feature hooks и services, те обращаются к стабильным интерфейсам репозиториев, а текущие реализации используют `localStorage`.

```text
UI / Components
  -> Feature hooks / services
    -> Repository interfaces
      -> LocalStorage implementations
```

При подключении Supabase последний уровень будет заменён на `SupabaseRepository`. JSX, пользовательские сценарии и правила отображения при этом менять не потребуется.

## Единый provider

`src/repositories/repository-provider.ts` создаёт по одному экземпляру каждого репозитория и экспортирует объект `repositories`:

- `repositories.appointments`;
- `repositories.staff`;
- `repositories.services`;
- `repositories.clients`;
- `repositories.schedules`.

Компоненты не создают реализации и не импортируют `local-storage-*-repository.ts`. `RepositoryContext` расширяет `TenantContext` и содержит `organizationId`, пользователя, роль и связанный `staffId`. Для публичного booking используется отдельный `accessMode: "public_booking"`: он разрешает только ограниченный публичный каталог, проверку доступности и создание новой записи, но не получает административные права.

## LocalStorage implementations

Текущие реализации находятся рядом со своими feature:

- `src/features/appointments/repositories`;
- `src/features/staff/repositories`;
- `src/features/services/repositories`;
- `src/features/clients/repositories`;
- `src/features/schedule/repositories`.

Низкоуровневый доступ к браузерному хранилищу инкапсулирован в `src/lib/storage`. Адаптер безопасно обрабатывает SSR, недоступный storage, повреждённый JSON и синхронизацию изменений между вкладками и внутри текущей вкладки.

Контракт адаптера включает `get`, `set`, `remove`, `subscribe` и `withLock`. Для мутаций записей `withLock` использует Web Locks API, а при его отсутствии — очередь внутри текущей вкладки. Чтение данных, повторная проверка конфликта и запись выполняются под одной блокировкой, поэтому параллельные вкладки не могут подтвердить один слот одновременно.

## Стабильные интерфейсы

Стабильными контрактами считаются методы feature-репозиториев, `RepositoryContext` и `RepositoryResult<T>`. Все операции асинхронны, поэтому реализация на Supabase сможет выполнять сетевые запросы без изменения вызывающего UI.

Помимо CRUD-операций, реализации обязаны сохранять следующие части контракта:

- подписки `subscribe` на изменения коллекций;
- `StaffRepository.listPublic` с безопасной публичной проекцией без телефона;
- чтение всех графиков через `ScheduleRepository.list` только в рамках разрешённых ролей;
- расчёт `ScheduleRepository.listAvailableSlots` с длительностью услуги, `bufferBeforeMinutes` и `bufferAfterMinutes`;
- повторную проверку пересечения непосредственно перед созданием записи.

Репозитории не импортируют React. Доменные типы остаются в соответствующих `features/*/types`, чтобы не появлялись параллельные определения одних и тех же сущностей.

## Ошибки

Каждая операция возвращает `RepositoryResult<T>` и не передаёт техническое исключение в компонент. Поддерживаются коды:

- `not_found`;
- `forbidden`;
- `validation_error`;
- `conflict`;
- `storage_unavailable`;
- `unknown`.

Для пользователя используются единые сообщения. В частности, конфликт времени отображается как «У сотрудника уже есть запись на это время.», а запрет прав — «Недостаточно прав для выполнения этого действия.».

## Локальная схема и совместимость

Версия локальной схемы и миграции описаны в `src/repositories/local-schema.ts`. Сохраняются существующие ключи:

- `karo-booking:appointments`;
- `karo-booking:staff`;
- `karo-booking:services`;
- `karo-booking:clients`;
- `karo-booking:staff-schedules`;
- `karo-booking:schema-version`;
- `karo-booking:current-user`.

Legacy-записи нормализуются при чтении. Отсутствующие у старой записи поля `status`, `durationMinutes`, `comment`, `bufferBeforeMinutes` и `bufferAfterMinutes` получают прежние безопасные значения; буферы по умолчанию равны `0`. Отсутствующий у старой услуги флаг `onlineBookingEnabled` трактуется как `true`, а отсутствующие буферы также нормализуются в `0`. Исходные массивы не удаляются и не переносятся под новые ключи.

Локальная реализация является single-tenant: provider выдаёт фиксированный `organizationId: "default-organization"`. Каждый репозиторий фильтрует чтение через `context.organizationId` и запрещает запись в неподдерживаемую организацию, поэтому другой tenant не получает доступ к данным текущих ключей. Хранение нескольких организаций в одних локальных массивах намеренно не добавляется; при переходе на Supabase полноценную tenant-изоляцию должны обеспечивать `organization_id` и PostgreSQL RLS.

## Подключение Supabase

Для следующей реализации нужно:

1. создать классы `SupabaseAppointmentRepository`, `SupabaseStaffRepository` и остальные реализации тех же интерфейсов;
2. перенести tenant-изоляцию и проверки прав в PostgreSQL/RLS, сохранив прикладные проверки как дополнительную защиту;
3. заменить сборку экземпляров в `repository-provider.ts`;
4. выполнить валидируемый импорт локальных данных по правилам версии схемы;
5. прогнать одинаковые contract tests для LocalStorage и Supabase реализаций.

UI и feature hooks при этом продолжают работать с теми же `RepositoryResult<T>`.

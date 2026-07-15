# Roadmap KARO Booking

## Текущий MVP

- Landing Page и публичный booking flow;
- административный Dashboard;
- сотрудники, услуги и записи на `localStorage`;
- календарь день/неделя/месяц;
- локальная ролевая модель admin/staff/viewer;
- рабочие графики, перерывы, выходные, отпуск и дополнительные интервалы;
- feature-based архитектура и дизайн-система.

## Этап 1 — Database design

- [x] Multi-tenant доменная модель;
- [x] ER-диаграмма;
- [x] модель PK/FK/unique/check/index constraints;
- [x] стратегия предотвращения двойной записи;
- [x] проект security/RLS-модели;
- [ ] финальное архитектурное review перед SQL.

## Этап 2 — Supabase project setup

- создать отдельные development, staging и production проекты;
- настроить секреты и environment variables;
- включить необходимые PostgreSQL extensions;
- настроить connection pooling, backup и базовый monitoring;
- не переносить service role key в клиентское приложение.

## Этап 3 — SQL migrations

- создать версионируемые миграции таблиц;
- добавить tenant-safe foreign keys;
- добавить CHECK, UNIQUE, exclusion constraints и индексы;
- добавить triggers для `updated_at`, status history и audit events;
- подготовить seed data только для development.

## Этап 4 — Row Level Security

- включить RLS на каждой tenant-owned таблице;
- реализовать membership helper functions;
- добавить политики owner/admin/staff/viewer для каждой операции;
- закрыть прямой публичный доступ к клиентам, платежам и аудитам;
- написать cross-tenant и negative security tests.

## Этап 5 — Auth

- подключить Supabase Auth;
- связать `auth.users` с прикладной таблицей `users`;
- реализовать выбор активной организации;
- добавить приглашения и управление `organization_members`;
- заменить локальный переключатель ролей реальной сессией и membership.

## Этап 6 — Migration from localStorage

- определить версию localStorage-формата;
- реализовать валидируемый одноразовый импорт;
- сопоставить локальные staff/service/appointment IDs с UUID;
- нормализовать телефоны, timezone и деньги;
- сформировать отчёт об ошибках и дублях;
- после подтверждения переключить UI на repository/service слой Supabase.

## Этап 7 — Production testing

- concurrency-тесты двойной записи;
- RLS-тесты для нескольких организаций и каждой роли;
- нагрузочные тесты календаря и публичного booking;
- тесты timezone/DST, платежей, уведомлений и idempotency;
- backup/restore и disaster recovery rehearsal;
- security review, observability и controlled rollout.

## Дальнейшее развитие

- клиенты и CRM-коммуникации;
- несколько услуг в одной записи;
- сотрудники в нескольких филиалах;
- онлайн-оплата и частичные возвраты;
- WhatsApp/SMS/email-уведомления;
- аналитика и отчётность;
- AI-администратор.

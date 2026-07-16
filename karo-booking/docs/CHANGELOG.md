# Changelog

## Unreleased

- Создана базовая feature-based архитектура.
- Добавлены landing page и административный dashboard на тестовых данных.
- Настроена публикация на GitHub Pages.
- Добавлен единый Repository Layer для записей, сотрудников, услуг, клиентов и графиков.
- Прямой доступ feature-компонентов и hooks к localStorage заменён типизированными repository contracts.
- Добавлены безопасный browser storage adapter, версия локальной схемы и legacy-нормализация данных.
- `RepositoryContext` расширен через `TenantContext`; все локальные репозитории изолируют данные по `organizationId: "default-organization"` без изменения существующих ключей.
- Расчёт видимого и блокируемого диапазона записи унифицирован, а публичные стартовые слоты генерируются с шагом 30 минут.

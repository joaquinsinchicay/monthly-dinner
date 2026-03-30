# Documentation System — monthly-dinner

Este repositorio utiliza un sistema de documentación estructurado para alinear producto, contratos, dominio y código.

---

## Source of truth (orden estricto)

1. `docs/product/backlog_us_mvp.md`
   - Define comportamiento funcional
   - Define alcance del MVP
   - Define acceptance criteria (Gherkin)
   - Es la única fuente de verdad de producto

2. `docs/features/*.md`
   - Traduce cada US a una definición completa
   - Consolida reglas de negocio, estados, permisos, actions y edge cases
   - Es la capa intermedia entre backlog y código

3. `docs/contracts/api-contracts.md`
   - Define server actions
   - Define inputs/outputs
   - Debe reflejar exactamente las features

4. `docs/domain/*`
   - Modelo de datos
   - Entidades y relaciones
   - Schema SQL

5. `docs/architecture/*`
   - Reglas transversales
   - State machine
   - Roles y permisos

6. `types/index.ts`
   - Tipos runtime alineados con contracts y domain

7. Código
   - Implementación final

---

## Reglas obligatorias

- El backlog define qué existe en el MVP
- Todo lo que no esté en el backlog debe eliminarse o deprecarse
- No se modifica código sin antes definir la US y documentarla
- No se considera una US terminada si:
  - no está documentada
  - contracts no están alineados
  - código no está alineado
- No se preserva código solo porque ya está implementado

---

## Flujo de trabajo

Para cada US:

1. Analizar divergencias
2. Definir versión final
3. Actualizar documentación
4. Refactorizar código
5. Validar con checklist
6. Registrar en changelog

---

## Estructura
docs/
product/
features/
contracts/
domain/
architecture/


---

## Objetivo

Evitar:
- features inconsistentes
- backlog desactualizado
- código fuera de alcance

Garantizar:
- trazabilidad completa
- coherencia producto ↔ código
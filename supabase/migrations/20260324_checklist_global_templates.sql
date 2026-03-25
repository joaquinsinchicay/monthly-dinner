-- Migration: checklist_global_templates
-- US-20 — Acceder al checklist del mes
--
-- Inserta los 5 templates globales del flujo del organizador.
-- global = true → sin group_id, visibles para todos los miembros autenticados.
-- Idempotente: solo inserta si no existen templates globales.
-- Ejecutar en Supabase → SQL Editor antes de deployar US-20.

insert into checklist_templates (label, description, order_index, global)
select label, description, order_index, true
from (values
  (0, 'Crear el evento del mes',       'Abrí el panel del evento y completá fecha, lugar y descripción.'),
  (1, 'Publicar la convocatoria',       'Publicá el evento para que el grupo reciba la notificación.'),
  (2, 'Abrir la votación',             'Creá la votación de restaurantes con al menos 2 opciones.'),
  (3, 'Confirmar el restaurante',      'Elegí el restaurante ganador y avisá al grupo.'),
  (4, 'Cerrar el evento',             'Cerrá el evento una vez terminada la cena y registrá el restaurante.')
) as t(order_index, label, description)
where not exists (select 1 from checklist_templates where global = true);

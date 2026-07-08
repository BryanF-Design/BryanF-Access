-- Example seed data for local development.
-- 1. Create a user in Supabase Auth (dashboard -> Authentication -> Add user),
--    e.g. cliente.demo@bryanfdesign.com.mx, and copy its UUID.
-- 2. Replace REPLACE_WITH_AUTH_USER_ID below with that UUID.
-- 3. Run this file in the SQL editor.

with new_client as (
  insert into public.clients (
    auth_user_id,
    full_name,
    company,
    email,
    phone,
    country,
    industry,
    drive_url
  )
  values (
    'REPLACE_WITH_AUTH_USER_ID',
    'Ana Torres',
    'Cafe Alameda',
    'cliente.demo@bryanfdesign.com.mx',
    '+52 55 0000 0000',
    'Mexico',
    'Alimentos y bebidas',
    'https://drive.google.com/'
  )
  returning id
),
new_project as (
  insert into public.projects (client_id, name, summary, status, total_price, currency, start_date, target_end_date)
  select id, 'Rediseno de marca - Cafe Alameda', 'Identidad visual, empaques y sitio web.', 'en_progreso', 68000, 'MXN', '2026-05-01', '2026-08-15'
  from new_client
  returning id
)
insert into public.payments (project_id, amount, paid_at, method, note)
select id, 34000, '2026-05-02', 'Transferencia', 'Anticipo 50%' from new_project;

-- Milestones
insert into public.milestones (project_id, title, description, position, due_date, status, completed_at)
select p.id, m.title, m.description, m.position, m.due_date::date, m.status,
       case when m.status = 'completado' then m.due_date::timestamptz else null end
from public.projects p
cross join (values
  ('Descubrimiento y moodboard', 'Investigacion de marca y direccion visual.', 1, '2026-05-10', 'completado'),
  ('Logotipo y sistema de marca', 'Logo, paleta, tipografia y guia de uso.', 2, '2026-06-05', 'completado'),
  ('Empaques', 'Diseno de empaques para linea de cafe de grano.', 3, '2026-07-01', 'en_progreso'),
  ('Sitio web', 'Diseno e implementacion del sitio.', 4, '2026-08-01', 'pendiente')
) as m(title, description, position, due_date, status)
where p.name = 'Rediseno de marca - Cafe Alameda';

-- Deliverables
insert into public.deliverables (project_id, milestone_id, name, version, status, delivered_at)
select p.id, ms.id, d.name, d.version, d.status,
       case when d.status = 'entregado' then now() else null end
from public.projects p
join public.milestones ms on ms.project_id = p.id
cross join (values
  ('Descubrimiento y moodboard', 'Moodboard final', 'v1', 'entregado'),
  ('Logotipo y sistema de marca', 'Manual de marca (PDF)', 'v2', 'entregado'),
  ('Empaques', 'Mockups de empaque - bolsa 250g', 'v1', 'en_revision')
) as d(milestone_title, name, version, status)
where p.name = 'Rediseno de marca - Cafe Alameda' and ms.title = d.milestone_title;

-- Project resources
insert into public.project_resources (project_id, title, description, resource_type, url, position)
select p.id, r.title, r.description, r.resource_type, r.url, r.position
from public.projects p
cross join (values
  ('Carpeta de Drive', 'Archivos aprobados y referencias del proyecto.', 'drive', 'https://drive.google.com/', 1),
  ('Tutoriales BryanF', 'Guia protegida dentro del portal para usar accesos y hosting.', 'tutorial', 'https://example.com/proyecto/tutoriales', 2)
) as r(title, description, resource_type, url, position)
where p.name = 'Rediseno de marca - Cafe Alameda';

-- Calendar events
insert into public.project_events (project_id, title, description, event_type, event_date, visibility, created_by)
select p.id, e.title, e.description, e.event_type, e.event_date::date, e.visibility, 'bryanf@bryanfdesign.com.mx'
from public.projects p
cross join (values
  ('Proyecto activado', 'Kickoff del expediente y primer anticipo recibido.', 'project', '2026-05-01', 'client'),
  ('Contenido de empaque actualizado', 'Se agregaron referencias y copy base para revision.', 'content', '2026-06-20', 'client'),
  ('Nota interna de hosting', 'Pendiente confirmar acceso de dominio.', 'other', '2026-06-22', 'admin')
) as e(title, description, event_type, event_date, visibility)
where p.name = 'Rediseno de marca - Cafe Alameda';

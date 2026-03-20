import type {
  Attendance,
  ChecklistItem,
  Group,
  GroupMember,
  MonthlyEvent,
  Notification,
  Poll,
  PollOption,
  PollVote,
  Profile,
} from '@/types/database';

export const currentUserId = 'user-joaquin';

export const profiles: Profile[] = [
  { id: currentUserId, email: 'joaquin@example.com', full_name: 'Joaquin Fernandez Sinchi', avatar_url: null, created_at: '2026-03-01T10:00:00Z' },
  { id: 'user-gustavo', email: 'gustavo@example.com', full_name: 'Gustavo', avatar_url: null, created_at: '2026-03-01T10:00:00Z' },
  { id: 'user-martin', email: 'martin@example.com', full_name: 'Martín', avatar_url: null, created_at: '2026-03-01T10:00:00Z' },
  { id: 'user-guido', email: 'guido@example.com', full_name: 'Guido', avatar_url: null, created_at: '2026-03-01T10:00:00Z' },
];

export const groups: Group[] = [
  { id: 'group-curated-table', name: 'Cenas del Jueves', created_by: currentUserId, created_at: '2026-03-01T10:00:00Z' },
];

export const groupMembers: GroupMember[] = [
  { id: 'gm-1', group_id: 'group-curated-table', user_id: currentUserId, role: 'organizador', rotation_order: 3, joined_at: '2026-03-01T10:00:00Z' },
  { id: 'gm-2', group_id: 'group-curated-table', user_id: 'user-gustavo', role: 'miembro', rotation_order: 1, joined_at: '2026-03-01T10:00:00Z' },
  { id: 'gm-3', group_id: 'group-curated-table', user_id: 'user-martin', role: 'miembro', rotation_order: 2, joined_at: '2026-03-01T10:00:00Z' },
  { id: 'gm-4', group_id: 'group-curated-table', user_id: 'user-guido', role: 'miembro', rotation_order: 4, joined_at: '2026-03-01T10:00:00Z' },
];

export const monthlyEvents: MonthlyEvent[] = [
  {
    id: 'event-mar-2026',
    group_id: 'group-curated-table',
    organizer_id: currentUserId,
    month: '2026-03-01',
    event_date: '2026-03-26',
    venue_name: 'Ajo Negro',
    venue_address: 'Palermo, Buenos Aires',
    description: 'Mesa grande, menú compartido y cierre con historial del grupo.',
    status: 'publicado',
    restaurant_name: null,
    closed_at: null,
    created_at: '2026-03-03T10:00:00Z',
  },
];

export const attendances: Attendance[] = [
  { id: 'att-1', event_id: 'event-mar-2026', user_id: currentUserId, status: 'va', updated_at: '2026-03-10T10:00:00Z' },
  { id: 'att-2', event_id: 'event-mar-2026', user_id: 'user-gustavo', status: 'tal_vez', updated_at: '2026-03-10T10:00:00Z' },
  { id: 'att-3', event_id: 'event-mar-2026', user_id: 'user-martin', status: 'no_va', updated_at: '2026-03-10T10:00:00Z' },
  { id: 'att-4', event_id: 'event-mar-2026', user_id: 'user-guido', status: 'sin_respuesta', updated_at: '2026-03-10T10:00:00Z' },
];

export const polls: Poll[] = [
  { id: 'poll-mar-2026', event_id: 'event-mar-2026', created_by: currentUserId, closes_at: '2026-03-24T23:00:00Z', status: 'activa', created_at: '2026-03-15T10:00:00Z' },
];

export const pollOptions: PollOption[] = [
  { id: 'opt-1', poll_id: 'poll-mar-2026', restaurant_name: 'Ajo Negro', created_at: '2026-03-15T10:00:00Z' },
  { id: 'opt-2', poll_id: 'poll-mar-2026', restaurant_name: 'Mishiguene', created_at: '2026-03-15T10:00:00Z' },
  { id: 'opt-3', poll_id: 'poll-mar-2026', restaurant_name: 'Julia', created_at: '2026-03-15T10:00:00Z' },
];

export const pollVotes: PollVote[] = [
  { id: 'vote-1', poll_id: 'poll-mar-2026', option_id: 'opt-1', user_id: currentUserId, voted_at: '2026-03-16T10:00:00Z' },
  { id: 'vote-2', poll_id: 'poll-mar-2026', option_id: 'opt-1', user_id: 'user-gustavo', voted_at: '2026-03-16T10:00:00Z' },
  { id: 'vote-3', poll_id: 'poll-mar-2026', option_id: 'opt-3', user_id: 'user-martin', voted_at: '2026-03-16T10:00:00Z' },
];

export const checklistItems: ChecklistItem[] = [
  { id: 'task-1', event_id: 'event-mar-2026', label: 'Crear evento del mes', is_completed: true, order_index: 1, completed_at: '2026-03-03T10:00:00Z' },
  { id: 'task-2', event_id: 'event-mar-2026', label: 'Publicar y notificar al grupo', is_completed: true, order_index: 2, completed_at: '2026-03-05T10:00:00Z' },
  { id: 'task-3', event_id: 'event-mar-2026', label: 'Abrir votación de restaurantes', is_completed: true, order_index: 3, completed_at: '2026-03-15T10:00:00Z' },
  { id: 'task-4', event_id: 'event-mar-2026', label: 'Cerrar votación y reservar', is_completed: false, order_index: 4, completed_at: null },
  { id: 'task-5', event_id: 'event-mar-2026', label: 'Cerrar evento y cargar restaurante', is_completed: false, order_index: 5, completed_at: null },
];

export const notifications: Notification[] = [
  { id: 'note-1', user_id: currentUserId, event_id: 'event-mar-2026', type: 'convocatoria', message: 'Nueva convocatoria publicada para el 26 de marzo.', read: false, created_at: '2026-03-05T10:00:00Z' },
  { id: 'note-2', user_id: currentUserId, event_id: 'event-mar-2026', type: 'votacion', message: 'La votación de restaurantes está abierta hasta el 24 de marzo.', read: true, created_at: '2026-03-15T10:00:00Z' },
];

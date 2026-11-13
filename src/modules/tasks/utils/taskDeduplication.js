/**
 * Deduplicate task items by ID and by semantic clone (same normalized title and project).
 * When duplicate clones exist, prefers the task with active progress (In Progress > Completed > Pending)
 * and latest updated ID.
 */
export const deduplicateTasks = (tasksList = []) => {
  if (!Array.isArray(tasksList)) return [];
  const seenIds = new Set();
  const map = new Map();

  const getTaskRank = (t) => {
    let score = 0;
    const st = (t.status || '').toLowerCase();
    if (st === 'in progress') score = 300;
    else if (st === 'completed') score = 200;
    else if (st === 'pending' || st === 'yet to start' || st === 'to do') score = 100;
    else score = 50;

    const idNum = Number(t.id) || 0;
    return score + idNum / 1000000;
  };

  // 1. First pass: remove exact duplicate IDs
  const uniqueById = [];
  for (const t of tasksList) {
    if (!t) continue;
    if (t.id !== undefined && t.id !== null) {
      const idStr = String(t.id);
      if (seenIds.has(idStr)) continue;
      seenIds.add(idStr);
    }
    uniqueById.push(t);
  }

  // 2. Second pass: remove duplicate clones (same normalized title, same project, same assignee, and same due date)
  for (const t of uniqueById) {
    const titleKey = (t.title || '').trim().toLowerCase();
    const projKey = String(t.project_id || t.project_name || 'general').trim().toLowerCase();
    const assigneeKey = String(t.assigned_to || t.assigned_to_name || 'none').trim().toLowerCase();
    const dueDateKey = String(t.due_date || t.estimated_end_date || '').split('T')[0];

    // If task has a non-trivial title, deduplicate clones only when they share the same assignee and due date
    if (titleKey.length > 2) {
      const key = `${titleKey}:::${projKey}:::${assigneeKey}:::${dueDateKey}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, t);
      } else {
        // Keep the task that is further along or more recently updated
        if (getTaskRank(t) > getTaskRank(existing)) {
          map.set(key, t);
        }
      }
    } else {
      const fallbackKey = `_raw_id_${t.id || Math.random()}`;
      map.set(fallbackKey, t);
    }
  }

  return Array.from(map.values());
};


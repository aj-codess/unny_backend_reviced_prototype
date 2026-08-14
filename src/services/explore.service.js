import { searchUsers } from './user.service.js';
import { exploreProjects } from './project.service.js';

/**
 * Backs GET /explore. One query, three use cases:
 *   ?scope=users&role=STUDENT     -> find a collaborator
 *   ?scope=users&role=SUPERVISOR  -> find a supervisor
 *   ?scope=projects               -> browse the approved project archive
 *   (scope omitted / "all")       -> both, side by side
 *
 * Reuses the existing user.service / project.service search logic rather
 * than duplicating query-building — this is purely an aggregation layer.
 */
export const exploreAll = async (requesterId, query) => {
  const scope = query.scope || 'all';
  const result = {};

  if (scope === 'all' || scope === 'users') {
    result.users = await searchUsers(requesterId, query);
  }

  if (scope === 'all' || scope === 'projects') {
    result.projects = await exploreProjects(query);
  }

  return result;
};

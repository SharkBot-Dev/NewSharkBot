import { ButtonRoleMap } from "@/constants/reaction_role/rolesmap";

export function buildActionRowsFromMap(rolesMap: ButtonRoleMap) {
  const entries = Object.entries(rolesMap);
  const rows = [];

  for (let i = 0; i < entries.length; i += 5) {
    const chunk = entries.slice(i, i + 5);
    rows.push({
      type: 1,
      components: chunk.map(([id, config]) => ({
        type: 2,
        style: config.style,
        label: config.label,
        emoji: config.emoji ? { name: config.emoji } : undefined,
        custom_id: `reaction_role:${config.roleId}`,
      })),
    });
  }
  return rows;
}
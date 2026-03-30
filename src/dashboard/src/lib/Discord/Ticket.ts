import { TicketButtonConfig, TicketButtonMap } from "@/constants/ticket/ticketmap";

export function buildActionRowsFromConfig(configs: TicketButtonConfig[], panelId: string) {
  const rows = [];
  
  for (let i = 0; i < configs.length; i += 5) {
    const chunk = configs.slice(i, i + 5);
    
    rows.push({
      type: 1,
      components: chunk.map((config) => ({
        type: 2,
        style: config.style,
        label: config.label,
        emoji: config.emoji ? { name: config.emoji } : undefined,
        custom_id: `ticket:${config.action}:${panelId}`,
      })),
    });
  }
  
  return rows;
}
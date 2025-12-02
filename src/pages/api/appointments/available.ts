import { AvailabilityService } from '@/1-app-global-core/services';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const startDate =
    url.searchParams.get('start') || new Date().toISOString().split('T')[0];
  const endDate = url.searchParams.get('end');
  const agentId =
    url.searchParams.get('agent_id') || '00000000-0000-0000-0000-000000000001';

  try {
    const { slots, error } = await AvailabilityService.getAvailabilitySlots(
      startDate,
      endDate,
      agentId
    );

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(slots), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

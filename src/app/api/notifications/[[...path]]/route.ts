import { handleProxy } from '@/shared/utils/apiProxy';

// Avisos del panel (GET /api/notifications?after=<last_id>)
export const GET = handleProxy;

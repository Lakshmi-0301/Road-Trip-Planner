/**
 * Trip Planning API — Road Trip Planner
 *
 * Calls GET /api/plan_trip with the form parameters.
 * Returns the full trip JSON or throws with a user-readable message.
 */

import axios from 'axios';

const API_BASE = 'http://localhost:8000';

/**
 * @param {{ source: string, destination: string, date: string, passengers: number }} params
 * @returns {Promise<object>} Full trip response JSON
 */
export async function planTrip({ source, destination, date, passengers }) {
  try {
    const response = await axios.get(`${API_BASE}/api/plan_trip`, {
      params: { source, destination, date, passengers },
    });
    return response.data;
  } catch (error) {
    const detail = error?.response?.data?.detail;
    if (detail) throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    throw new Error('Unable to reach the trip planning service. Please try again.');
  }
}

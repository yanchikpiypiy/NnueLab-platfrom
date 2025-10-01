import { API_URL } from '../../config';

export const mazeAPI = {
    async generateMaze(width, height, tile = 2) {
        try {
            const response = await fetch(
                `${API_URL}/api/maze?width=${width}&height=${height}&tile=${tile}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            const rows = text
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0);

            return rows;
        } catch (error) {
            console.error('Error fetching maze:', error);
            throw error;
        }
    },
};

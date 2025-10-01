import { API_URL } from '../../config';

export const chessAPI = {
    async makeMove(move) {
        try {
            const response = await fetch(`${API_URL}/chess/makemove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ move }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error making move:', error);
            throw error;
        }
    },

    async resetGame() {
        try {
            const response = await fetch(`${API_URL}/chess/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            return await response.json();
        } catch (error) {
            console.error('Error resetting game:', error);
            throw error;
        }
    },
};

require('dotenv').config();

const db = require('./app/models');

const ACTIVE_IN_MINUTES = 5;

function setUpLineRoute(app) {
    app.get('/status', async function (req, res) {
        const { isWorking, lastedActive } = await checkIsBotWorking();

        res.json({
            isWorking,
            lastedActive,
        });
    });
}

/**
 * Checks if the bot is working based on the last transaction record in the database.
 *
 * @async
 * @function checkIsBotWorking
 * @returns {Promise<{
*  isWorking: boolean,
*  lastedActive: string
* }>} An object containing a boolean value indicating if the bot is working and a string representation of the last active timestamp.
*/
async function checkIsBotWorking() {
    const lastedTransaction = await db.botTransction
        .findOne({
            where: { bot_type: 1, },
            order: [['createdAt', 'DESC']],
        })

    if (!lastedTransaction) {
        return {
            isWorking: false,
            lastedActive: 'N/A',
        }
    }

    const lastedActive = lastedTransaction.createdAt;
    const now = new Date();
    const diff = now - lastedActive;

    const isWorking = diff < 1000 * 60 * ACTIVE_IN_MINUTES;

    return {
        isWorking,
        lastedActive: lastedActive.toISOString(),
    }
}

module.exports = {
    setUpLineRoute
};

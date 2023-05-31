require('dotenv').config();

const { QueryTypes } = require('sequelize');
const jwt = require('jsonwebtoken');

const db = require('./app/models');
const { parseDateIso } = require('./utilities');

const ACTIVE_IN_MINUTES = 10;

const authenticateJwtToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'JWT token is missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'JWT token is invalid' });
        }

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'User ID is not allowed' });
        }

        req.user = decoded;
        next();
    });
};

function setUpLineRoute(app) {
    app.get('/status', authenticateJwtToken, async function (req, res) {
        const { isWorking, latestActive } = await checkIsBotWorking();

        res.json({
            isWorking,
            latestActive,
        });
    });

    app.post('/usage/total', authenticateJwtToken, async function (req, res) {
        if (!req.body || !req.body.start_time || !req.body.end_time) {
            return res.sendStatus(400);
        }

        const { start_time: startTime, end_time: endTime } = req.body;

        const { users, total, startDate, endDate } = await getTotalUserAndTransactionByTimeRange(startTime, endTime)

        res.json({
            users,
            total,
            startDate,
            endDate,
        });
    });

    app.post('/usage/query', authenticateJwtToken, async function (req, res) {
        if (!req.body || !req.body.username || !req.body.start_time || !req.body.end_time) {
            return res.sendStatus(400);
        }

        const { username, start_time: startTime, end_time: endTime } = req.body;

        const { total, startDate, endDate } = await getTotalTransactionByUsernameAndTimeRange(username, startTime, endTime)

        res.json({
            total,
            startDate,
            endDate,
        });
    })
}

/**
 * Checks if the bot is working based on the last transaction record in the database.
 *
 * @async
 * @function checkIsBotWorking
 * @returns {Promise<{
*  isWorking: boolean,
*  latestActive: string
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
            latestActive: 'N/A',
        }
    }

    const latestActive = lastedTransaction.createdAt;
    const now = new Date();
    const diff = now - latestActive;

    const isWorking = diff < 1000 * 60 * ACTIVE_IN_MINUTES;

    return {
        isWorking,
        latestActive: latestActive.toISOString(),
    }
}

/**
 * Retrieves the total number of unique users and the sum of their transactions values within a time range.
 *
 * @async
 * @function getTotalUserAndTransactionByTimeRange
 *
 * @param {(string|Date)} start - The start date of the time range.
 * @param {(string|Date)} end - The end date of the time range.
 *
 * @returns {Promise<{
*  users: number,
*  total: number,
*  startDate: string,
*  endDate: string
* }>}
*/
async function getTotalUserAndTransactionByTimeRange(start, end) {
    const startTimeIso = parseDateIso(start);
    const endTimeIso = parseDateIso(end);

    const result = await db.sequelize.query(
        `SELECT COUNT(DISTINCT(users.id)) users, sum(ut.value) total
        FROM user_transactions ut
        LEFT JOIN bots ON ut.botId = bots.id 
        LEFT JOIN users ON bots.userId = users.id
        WHERE ut.updatedAt > :start
        AND ut.updatedAt < :end
        AND users.is_mock = 0
        ORDER BY ut.value DESC`,
        {
            replacements: {
                start: startTimeIso,
                end: endTimeIso,
            },
            type: QueryTypes.SELECT,
        }
    );

    const res = result?.[0] || { users: 0, total: 0 };

    return {
        users: res.users,
        total: res.total,
        startDate: startTimeIso,
        endDate: endTimeIso,
    }
}


/**
 * Gets the total transaction amount for a specific user within a given time range.
 *
 * @async
 * @function getTotalTransactionByUsernameAndTimeRange
 *
 * @param {string} username - The username of the user to retrieve the total transaction amount for.
 * @param {(string|Date)} start - The start date of the time range.
 * @param {(string|Date)} end - The end date of the time range.
 *
 * @returns {Promise<{
*  total: number,
*  startDate: string,
*  endDate: string
* }>}
*/
async function getTotalTransactionByUsernameAndTimeRange(username, start, end) {
    const startTimeIso = parseDateIso(start);
    const endTimeIso = parseDateIso(end);

    const result = await db.sequelize.query(
        `SELECT sum(ut.value) total
        FROM user_transactions ut
        LEFT JOIN bots ON ut.botId = bots.id 
        LEFT JOIN users ON bots.userId = users.id
        WHERE ut.updatedAt > :start
        AND ut.updatedAt < :end
        AND users.username = :username
        ORDER BY ut.value DESC`,
        {
            replacements: {
                username,
                start: startTimeIso,
                end: endTimeIso,
            },
            type: QueryTypes.SELECT,
        }
    );

    const res = result?.[0] || { total: 0 };

    return {
        total: res.total || 0,
        startDate: startTimeIso,
        endDate: endTimeIso,
    }
}

module.exports = {
    setUpLineRoute
};

'use strict';

const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { emailQueue } = require('../queue/email.queue');
const logger = require('../utils/logger');

// Create the adapter for Express
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Create the board
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [
        new BullMQAdapter(emailQueue),
    ],
    serverAdapter: serverAdapter,
});

logger.info('📊 BullMQ Dashboard configured at /admin/queues');

module.exports = serverAdapter.getRouter();

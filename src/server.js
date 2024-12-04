import app from './app.js';
import {loadingAnimation} from "./utils/loadingAnimation.js";
import {logger} from "./utils/logger.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
    await loadingAnimation(500); // Adjust duration as needed

    try {
        app.listen(PORT, () => {
            logger.info(`Server running at http://${HOST}:${PORT}`);
        });
    } catch (error) {
        logger.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
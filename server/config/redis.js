import { createClient } from 'redis';

const redisClient = createClient({
    url: 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => {
    console.log('Redis Error:', err);
});

export const connectRedis = async () => {

    await redisClient.connect();

    console.log('Redis Connected Successfully');

};

export default redisClient;

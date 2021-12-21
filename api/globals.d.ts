declare namespace NodeJS {
    export interface ProcessEnv {
        NODE_ENV: 'development' | 'production' | 'test';
        APP_SECRET: string;
        APP_REFRESH_SECRET: string;
        PORT?: string;
        AWS_ACCESS_KEY: string;
        AWS_SECRET_ACCESS_KEY: string;
        AWS_BUCKET: string;
        S3ADDRESS: string | undefined;
        EXTERNAL_S3_ADDRESS: string | undefined;
        // REDIS_SECRET: string;
        // REDIS_PORT: string;
        // REDIS_HOST: string;
    }
}

export const asynchandler = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        // Validate that error.code is a number, default to 500 otherwise
        // console.log(error);
        const statusCode = typeof error.code === 'number' ? error.code : 500;
        res?.status(statusCode).json({
            success: false,
            message: error.message|| 'Internal Server Error'
        });
    }
};
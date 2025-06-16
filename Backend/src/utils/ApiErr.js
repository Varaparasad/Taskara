 class ApiErr extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        error = [], // Changed from error to errors to match the property name
        stack = ""
    ) {
        super(message); // Call the parent class constructor (Error)

        this.statusCode = statusCode;
        this.data = null; 
        this.message = message;
        this.success = false;
        this.error = this.error; // Fixed the assignment

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiErr}
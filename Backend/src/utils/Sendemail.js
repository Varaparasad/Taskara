import nodemailer from 'nodemailer';

const sendEmail = async (options) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS, 
        },
    });

    // email options
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: options.email,            // List of receivers
        subject: options.subject,     // Subject line
        html: options.message,        // HTML body
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;
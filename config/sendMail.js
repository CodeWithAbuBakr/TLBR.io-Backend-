import { createTransport } from "nodemailer";

const sendMail = async (email, subject, html) => {
    const transporter = createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        // secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        }
    });

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject,
        html,
    });
}

export default sendMail;
import { Transporter } from 'nodemailer';
export declare let transporter: Transporter | null;
export declare type EmailOptions = {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
};
export default function sendMail(options: EmailOptions): Promise<void>;
export declare function sendInviteMail(email: string, url: string): Promise<void>;
export declare function sendPasswordResetMail(email: string, url: string): Promise<void>;

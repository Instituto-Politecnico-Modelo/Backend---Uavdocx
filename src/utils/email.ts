import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); 

export const enviarCorreoVerificacion = async (email: string, token: string) => {

  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.MAIL, 
      pass: process.env.PASS,
    },
  });

  const enlace = `http://localhost:3000/usuarios/verificar/${token}`;

  const mailOptions = {
    from: process.env.MAIL,
    to: email,
    subject: 'Confirma tu cuenta',
    html: `<h2>Verifica tu cuenta</h2>
           <p>Haz clic en el siguiente enlace para activar tu cuenta:</p>
           <a href="${enlace}">Confirmar Cuenta</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo enviado');
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
};

export const enviarCorreoReset = async (email: string, token: string) => {


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL,
      pass: process.env.PASS,
    },
  });

  const url = `http://localhost:4200/usuarios/resetear-contrasenia/${token}`;
  const mailOptions = {
    from: process.env.MAIL,
    to: email,
    subject: 'Restablece tu contraseña',
    html: `<p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${url}">${url}</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo de restablecimiento enviado');
  } catch (error) {
    console.error('Error al enviar el correo de restablecimiento:', error);
  }
};

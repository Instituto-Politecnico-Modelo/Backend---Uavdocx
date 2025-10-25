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
    html: `
      <div style="background:#fff;color:#222;font-family:sans-serif;padding:32px 24px;border-radius:8px;max-width:400px;margin:auto;border:1px solid #eee;">
        <h2 style="color:#111;text-align:center;margin-bottom:16px;">Verifica tu cuenta</h2>
        <p style="margin-bottom:24px;text-align:center;">Haz clic en el siguiente enlace para activar tu cuenta:</p>
        <div style="text-align:center;">
          <a href="${enlace}" style="display:inline-block;padding:10px 24px;background:#111;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;">Confirmar Cuenta</a>
        </div>
      </div>
    `,
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
    html: `
      <div style="background:#fff;color:#222;font-family:sans-serif;padding:32px 24px;border-radius:8px;max-width:400px;margin:auto;border:1px solid #eee;">
        <h2 style="color:#111;text-align:center;margin-bottom:16px;">Restablece tu contraseña</h2>
        <p style="margin-bottom:24px;text-align:center;">Hacé clic en el siguiente enlace para restablecer tu contraseña:</p>
        <div style="text-align:center;">
          <a href="${url}" style="display:inline-block;padding:10px 24px;background:#111;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;">Restablecer contraseña</a>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo de restablecimiento enviado');
  } catch (error) {
    console.error('Error al enviar el correo de restablecimiento:', error);
  }
};

export const enviarCorreoCompraRealizada = async (email: string, detallesCompra: string) => {
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL,
      pass: process.env.PASS,
    },
  });
  
  const mailOptions = {
    from: process.env.MAIL,
    to: email,
    subject: 'Compra realizada con éxito',
    html: `
      <div style="background:#fff;color:#222;font-family:sans-serif;padding:32px 24px;border-radius:8px;max-width:400px;margin:auto;border:1px solid #eee;">
        <h2 style="color:#111;text-align:center;margin-bottom:16px;">Detalles de tu compra</h2>
        <p style="margin-bottom:24px;text-align:center;">${detallesCompra}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo de compra enviado');
  } catch (error) {
    console.error('Error al enviar el correo de compra:', error);
  }
};

export const enviarCorreoCompraConfirmada = async (email: string, detallesCompra: string) => {
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL,
      pass: process.env.PASS,
    },
  });
  const mailOptions = {
    from: process.env.MAIL,
    to: email,
    subject: 'Compra confirmada',
    html: `
      <div style="background:#fff;color:#222;font-family:sans-serif;padding:32px 24px;border-radius:8px;max-width:400px;margin:auto;border:1px solid #eee;">
        <h2 style="color:#111;text-align:center;margin-bottom:16px;">Tu compra ha sido confirmada</h2>
        <p style="margin-bottom:24px;text-align:center;">${detallesCompra}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo de compra confirmada enviado');
  } catch (error) {
    console.error('Error al enviar el correo de compra confirmada:', error);
  }
};

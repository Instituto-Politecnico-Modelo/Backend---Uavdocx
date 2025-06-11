import nodemailer from 'nodemailer';

export const enviarCorreoVerificacion = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

  const enlace = `http://localhost:3000/usuarios/verificar/${token}`;

  const mailOptions = {
    from: process.env.USER,
    to: email,
    subject: 'Confirma tu cuenta',
    html: `<h2>Verifica tu cuenta</h2>
           <p>Haz clic en el siguiente enlace para activar tu cuenta:</p>
           <a href="${enlace}">Confirmar Cuenta</a>`,
  };

  await transporter.sendMail(mailOptions);
};



export const enviarCorreoReset = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    }
  });

  const url = `http://localhost:4200/usuarios/resetear-contrasenia/${token}`;
  const mailOptions = {
    from: process.env.USER,
    to: email,
    subject: 'Restablece tu contraseña',
    html: `<p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${url}">${url}</a>`
  };

  await transporter.sendMail(mailOptions);
};
